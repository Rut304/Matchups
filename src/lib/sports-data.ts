// Full Sports Data - Matchups, Players, Teams, Leagues
// Comprehensive data for NFL, NBA, NHL, MLB

export type Sport = 'NFL' | 'NBA' | 'NHL' | 'MLB'
export type GameStatus = 'scheduled' | 'live' | 'final' | 'postponed'

// =============================================================================
// LEAGUE DATA
// =============================================================================

export interface League {
  id: string
  name: string
  sport: Sport
  season: string
  currentWeek?: number
  playoffRound?: string
  standings: DivisionStanding[]
}

export interface DivisionStanding {
  division: string
  conference: string
  teams: TeamStanding[]
}

export interface TeamStanding {
  team: string
  teamCode: string
  wins: number
  losses: number
  ties?: number
  otLosses?: number
  pct: number
  streak: string
  last10?: string
  homeRecord: string
  awayRecord: string
  divisionRecord?: string
  conferenceRecord?: string
  pointsFor?: number
  pointsAgainst?: number
  pointDiff?: number
  playoffSeed?: number
}

// =============================================================================
// TEAM DATA
// =============================================================================

export interface Team {
  id: string
  name: string
  code: string
  city: string
  sport: Sport
  conference: string
  division: string
  stadium: string
  headCoach: string
  record: string
  atsRecord: string
  ouRecord: string
  homeAtsRecord: string
  awayAtsRecord: string
  last5ATS: string[]
  avgPointsFor: number
  avgPointsAgainst: number
  injuries: PlayerInjury[]
  trends: TeamTrend[]
}

export interface PlayerInjury {
  player: string
  position: string
  status: 'out' | 'doubtful' | 'questionable' | 'probable' | 'gtd'
  injury: string
  impact: 'high' | 'medium' | 'low'
}

export interface TeamTrend {
  description: string
  record: string
  winPct: number
  ats: boolean
}

// =============================================================================
// PLAYER DATA
// =============================================================================

export interface Player {
  id: string
  name: string
  team: string
  sport: Sport
  position: string
  number: number
  stats: PlayerStats
  propsAvailable: PlayerProp[]
}

export interface PlayerStats {
  gamesPlayed: number
  [key: string]: number | string
}

export interface PlayerProp {
  market: string
  line: number
  overOdds: number
  underOdds: number
  trend: 'over' | 'under' | 'even'
  hitRate: number // % this player has hit this prop
}

// =============================================================================
// MATCHUP DATA
// =============================================================================

export interface Matchup {
  id: string
  sport: Sport
  status: GameStatus
  gameTime: string
  venue: string
  broadcast: string
  home: MatchupTeam
  away: MatchupTeam
  weather?: WeatherConditions
  lines: BettingLines
  publicBetting: PublicBetting
  keyStats: KeyMatchupStat[]
  injuries: MatchupInjury[]
  trends: MatchupTrend[]
  aiPick?: AIPick
}

export interface MatchupTeam {
  name: string
  code: string
  record: string
  score?: number
  spread: number
  spreadOdds: number
  ml: number
}

export interface WeatherConditions {
  temp: number
  wind: number
  conditions: string
  dome: boolean
}

export interface BettingLines {
  spread: { home: number; away: number; homeOdds: number; awayOdds: number }
  total: { line: number; overOdds: number; underOdds: number }
  moneyline: { home: number; away: number }
  openSpread: number
  openTotal: number
}

export interface PublicBetting {
  spreadHome: number
  spreadAway: number
  moneyHome: number
  moneyAway: number
  overPct: number
  underPct: number
  sharpMoney?: 'home' | 'away' | 'over' | 'under'
}

export interface KeyMatchupStat {
  stat: string
  home: string | number
  away: string | number
  advantage: 'home' | 'away' | 'even'
}

export interface MatchupInjury {
  player: string
  team: string
  status: string
  impact: string
}

export interface MatchupTrend {
  description: string
  applies: 'home' | 'away' | 'over' | 'under'
  record: string
}

export interface AIPick {
  pick: string
  confidence: number
  reasoning: string
}

// =============================================================================
// NFL DATA
// =============================================================================

export const nflTeams: Team[] = [
  {
    id: 'kc', name: 'Kansas City Chiefs', code: 'KC', city: 'Kansas City', sport: 'NFL',
    conference: 'AFC', division: 'West', stadium: 'GEHA Field at Arrowhead Stadium',
    headCoach: 'Andy Reid', record: '14-3', atsRecord: '10-7', ouRecord: '8-9',
    homeAtsRecord: '5-3', awayAtsRecord: '5-4', last5ATS: ['W', 'L', 'W', 'W', 'L'],
    avgPointsFor: 28.4, avgPointsAgainst: 19.2,
    injuries: [
      { player: 'Patrick Mahomes', position: 'QB', status: 'questionable', injury: 'Ankle', impact: 'high' }
    ],
    trends: [
      { description: 'Chiefs are 8-2 ATS as home favorites', record: '8-2', winPct: 80, ats: true },
      { description: 'Chiefs overs are 6-3 in primetime', record: '6-3', winPct: 66.7, ats: false }
    ]
  },
  {
    id: 'buf', name: 'Buffalo Bills', code: 'BUF', city: 'Buffalo', sport: 'NFL',
    conference: 'AFC', division: 'East', stadium: 'Highmark Stadium',
    headCoach: 'Sean McDermott', record: '13-4', atsRecord: '11-6', ouRecord: '9-8',
    homeAtsRecord: '6-2', awayAtsRecord: '5-4', last5ATS: ['W', 'W', 'L', 'W', 'W'],
    avgPointsFor: 30.1, avgPointsAgainst: 21.4,
    injuries: [
      { player: 'Josh Allen', position: 'QB', status: 'doubtful', injury: 'Elbow', impact: 'high' }
    ],
    trends: [
      { description: 'Bills are 7-2 ATS as favorites of 7+', record: '7-2', winPct: 77.8, ats: true },
      { description: 'Bills unders are 5-2 in cold weather games', record: '5-2', winPct: 71.4, ats: false }
    ]
  },
  {
    id: 'det', name: 'Detroit Lions', code: 'DET', city: 'Detroit', sport: 'NFL',
    conference: 'NFC', division: 'North', stadium: 'Ford Field',
    headCoach: 'Dan Campbell', record: '14-3', atsRecord: '12-5', ouRecord: '10-7',
    homeAtsRecord: '7-1', awayAtsRecord: '5-4', last5ATS: ['W', 'W', 'W', 'L', 'W'],
    avgPointsFor: 31.2, avgPointsAgainst: 22.8,
    injuries: [],
    trends: [
      { description: 'Lions are 9-1 ATS at home', record: '9-1', winPct: 90, ats: true },
      { description: 'Lions overs are 8-2 vs NFC opponents', record: '8-2', winPct: 80, ats: false }
    ]
  },
  {
    id: 'phi', name: 'Philadelphia Eagles', code: 'PHI', city: 'Philadelphia', sport: 'NFL',
    conference: 'NFC', division: 'East', stadium: 'Lincoln Financial Field',
    headCoach: 'Nick Sirianni', record: '13-4', atsRecord: '10-7', ouRecord: '8-9',
    homeAtsRecord: '6-2', awayAtsRecord: '4-5', last5ATS: ['L', 'W', 'W', 'W', 'L'],
    avgPointsFor: 27.8, avgPointsAgainst: 18.9,
    injuries: [],
    trends: [
      { description: 'Eagles are 6-1 ATS as home favorites', record: '6-1', winPct: 85.7, ats: true }
    ]
  }
]

export const nflMatchups: Matchup[] = [
  {
    id: 'nfl-wc-1',
    sport: 'NFL',
    status: 'scheduled',
    gameTime: '2026-01-11T13:00:00Z',
    venue: 'Highmark Stadium',
    broadcast: 'CBS',
    home: { name: 'Buffalo Bills', code: 'BUF', record: '13-4', spread: -7, spreadOdds: -110, ml: -320 },
    away: { name: 'Denver Broncos', code: 'DEN', record: '10-7', spread: 7, spreadOdds: -110, ml: +260 },
    weather: { temp: 18, wind: 12, conditions: 'Partly cloudy', dome: false },
    lines: {
      spread: { home: -7, away: 7, homeOdds: -110, awayOdds: -110 },
      total: { line: 46.5, overOdds: -110, underOdds: -110 },
      moneyline: { home: -320, away: +260 },
      openSpread: -7,
      openTotal: 47.5
    },
    publicBetting: { spreadHome: 72, spreadAway: 28, moneyHome: 78, moneyAway: 22, overPct: 45, underPct: 55 },
    keyStats: [
      { stat: 'Points Per Game', home: 30.1, away: 24.2, advantage: 'home' },
      { stat: 'Yards Allowed/Game', home: 310.4, away: 298.2, advantage: 'away' },
      { stat: 'Turnover Diff', home: +12, away: +5, advantage: 'home' }
    ],
    injuries: [
      { player: 'Josh Allen', team: 'BUF', status: 'Doubtful (Elbow)', impact: 'MASSIVE - Line will crater if out' }
    ],
    trends: [
      { description: 'Bills are 8-1 ATS at home this season', applies: 'home', record: '8-1' },
      { description: 'Broncos are 3-6 ATS as road underdogs', applies: 'away', record: '3-6' },
      { description: 'Under is 5-2 in Bills home games with temp <30°F', applies: 'under', record: '5-2' }
    ],
    aiPick: {
      pick: 'Wait on Josh Allen status. If OUT, take DEN +3.5. If IN, take BUF -7.',
      confidence: 72,
      reasoning: 'This line is entirely dependent on Allen. Current -7 assumes healthy Allen. If Trubisky starts, expect line crash to -1/-2.'
    }
  },
  {
    id: 'nfl-wc-2',
    sport: 'NFL',
    status: 'scheduled',
    gameTime: '2026-01-11T16:30:00Z',
    venue: 'Lincoln Financial Field',
    broadcast: 'FOX',
    home: { name: 'Philadelphia Eagles', code: 'PHI', record: '13-4', spread: -5.5, spreadOdds: -110, ml: -240 },
    away: { name: 'Green Bay Packers', code: 'GB', record: '11-6', spread: 5.5, spreadOdds: -110, ml: +200 },
    weather: { temp: 34, wind: 8, conditions: 'Clear', dome: false },
    lines: {
      spread: { home: -5.5, away: 5.5, homeOdds: -110, awayOdds: -110 },
      total: { line: 48, overOdds: -110, underOdds: -110 },
      moneyline: { home: -240, away: +200 },
      openSpread: -6,
      openTotal: 47
    },
    publicBetting: { spreadHome: 65, spreadAway: 35, moneyHome: 68, moneyAway: 32, overPct: 58, underPct: 42 },
    keyStats: [
      { stat: 'Rush Yards/Game', home: 142.8, away: 118.4, advantage: 'home' },
      { stat: 'Pass Yards Allowed', home: 198.2, away: 224.6, advantage: 'home' },
      { stat: '3rd Down Conv %', home: 44.2, away: 41.8, advantage: 'home' }
    ],
    injuries: [],
    trends: [
      { description: 'Eagles are 6-1 ATS as home playoff favorites', applies: 'home', record: '6-1' },
      { description: 'Packers are 4-2 ATS as road playoff dogs', applies: 'away', record: '4-2' },
      { description: 'Over is 7-3 in Eagles home games vs NFC', applies: 'over', record: '7-3' }
    ],
    aiPick: {
      pick: 'PHI -5.5 / Over 48',
      confidence: 68,
      reasoning: 'Eagles dominant at home. Packers struggle vs elite rushing attacks. Game should be high-scoring with both offenses clicking.'
    }
  }
]

// =============================================================================
// NBA DATA
// =============================================================================

export const nbaTeams: Team[] = [
  {
    id: 'okc', name: 'Oklahoma City Thunder', code: 'OKC', city: 'Oklahoma City', sport: 'NBA',
    conference: 'Western', division: 'Northwest', stadium: 'Paycom Center',
    headCoach: 'Mark Daigneault', record: '32-8', atsRecord: '24-16', ouRecord: '18-22',
    homeAtsRecord: '14-6', awayAtsRecord: '10-10', last5ATS: ['W', 'W', 'W', 'L', 'W'],
    avgPointsFor: 118.4, avgPointsAgainst: 106.2,
    injuries: [],
    trends: [
      { description: 'Thunder are 12-3 ATS as home favorites', record: '12-3', winPct: 80, ats: true },
      { description: 'Thunder unders are 8-2 vs teams with pace <100', record: '8-2', winPct: 80, ats: false }
    ]
  },
  {
    id: 'bos', name: 'Boston Celtics', code: 'BOS', city: 'Boston', sport: 'NBA',
    conference: 'Eastern', division: 'Atlantic', stadium: 'TD Garden',
    headCoach: 'Joe Mazzulla', record: '30-10', atsRecord: '22-18', ouRecord: '20-20',
    homeAtsRecord: '12-8', awayAtsRecord: '10-10', last5ATS: ['W', 'L', 'W', 'W', 'L'],
    avgPointsFor: 120.2, avgPointsAgainst: 110.8,
    injuries: [],
    trends: [
      { description: 'Celtics are 15-5 ATS vs sub-.500 teams', record: '15-5', winPct: 75, ats: true }
    ]
  },
  {
    id: 'cle', name: 'Cleveland Cavaliers', code: 'CLE', city: 'Cleveland', sport: 'NBA',
    conference: 'Eastern', division: 'Central', stadium: 'Rocket Mortgage FieldHouse',
    headCoach: 'Kenny Atkinson', record: '31-9', atsRecord: '25-15', ouRecord: '22-18',
    homeAtsRecord: '14-5', awayAtsRecord: '11-10', last5ATS: ['W', 'W', 'W', 'W', 'L'],
    avgPointsFor: 121.8, avgPointsAgainst: 108.4,
    injuries: [],
    trends: [
      { description: 'Cavaliers are 18-4 ATS vs Eastern Conference', record: '18-4', winPct: 81.8, ats: true }
    ]
  }
]

export const nbaMatchups: Matchup[] = [
  {
    id: 'nba-1',
    sport: 'NBA',
    status: 'scheduled',
    gameTime: '2026-01-04T19:30:00Z',
    venue: 'Paycom Center',
    broadcast: 'ESPN',
    home: { name: 'Oklahoma City Thunder', code: 'OKC', record: '32-8', spread: -6.5, spreadOdds: -110, ml: -280 },
    away: { name: 'Denver Nuggets', code: 'DEN', record: '24-16', spread: 6.5, spreadOdds: -110, ml: +230 },
    lines: {
      spread: { home: -6.5, away: 6.5, homeOdds: -110, awayOdds: -110 },
      total: { line: 224.5, overOdds: -110, underOdds: -110 },
      moneyline: { home: -280, away: +230 },
      openSpread: -5,
      openTotal: 225
    },
    publicBetting: { spreadHome: 45, spreadAway: 55, moneyHome: 52, moneyAway: 48, overPct: 48, underPct: 52, sharpMoney: 'home' },
    keyStats: [
      { stat: 'Offensive Rating', home: 119.8, away: 116.2, advantage: 'home' },
      { stat: 'Defensive Rating', home: 107.2, away: 112.8, advantage: 'home' },
      { stat: 'Net Rating', home: +12.6, away: +3.4, advantage: 'home' }
    ],
    injuries: [],
    trends: [
      { description: 'Thunder are 8-2 ATS vs Western playoff teams', applies: 'home', record: '8-2' },
      { description: 'Reverse line movement: 78% money on OKC, line moved from -5 to -6.5', applies: 'home', record: 'N/A' }
    ],
    aiPick: {
      pick: 'OKC -6.5',
      confidence: 74,
      reasoning: 'Sharp money clearly on Thunder. Line movement against public is textbook sharp indicator. SGA at home is elite.'
    }
  },
  {
    id: 'nba-2',
    sport: 'NBA',
    status: 'scheduled',
    gameTime: '2026-01-04T20:00:00Z',
    venue: 'TD Garden',
    broadcast: 'ESPN',
    home: { name: 'Boston Celtics', code: 'BOS', record: '30-10', spread: -9.5, spreadOdds: -110, ml: -450 },
    away: { name: 'Philadelphia 76ers', code: 'PHI', record: '18-22', spread: 9.5, spreadOdds: -110, ml: +350 },
    lines: {
      spread: { home: -9.5, away: 9.5, homeOdds: -110, awayOdds: -110 },
      total: { line: 215, overOdds: -110, underOdds: -110 },
      moneyline: { home: -450, away: +350 },
      openSpread: -5.5,
      openTotal: 222
    },
    publicBetting: { spreadHome: 68, spreadAway: 32, moneyHome: 75, moneyAway: 25, overPct: 35, underPct: 65 },
    keyStats: [
      { stat: 'Points Per Game', home: 120.2, away: 108.4, advantage: 'home' },
      { stat: 'Defensive Efficiency', home: 108.2, away: 114.6, advantage: 'home' }
    ],
    injuries: [
      { player: 'Joel Embiid', team: 'PHI', status: 'Out (Rest)', impact: 'Line moved 4 points - may be overreaction' }
    ],
    trends: [
      { description: '76ers are 4-11 ATS without Embiid this season', applies: 'home', record: '4-11' },
      { description: 'Under is 8-2 in Celtics home games vs Embiid-less 76ers', applies: 'under', record: '8-2' }
    ],
    aiPick: {
      pick: 'PHI +9.5 / Under 215',
      confidence: 66,
      reasoning: 'Line moved 4 points on Embiid news - overreaction. 76ers defense actually improves pace without Embiid. Take the points and under.'
    }
  }
]

// =============================================================================
// NHL DATA
// =============================================================================

export const nhlTeams: Team[] = [
  {
    id: 'wpg', name: 'Winnipeg Jets', code: 'WPG', city: 'Winnipeg', sport: 'NHL',
    conference: 'Western', division: 'Central', stadium: 'Canada Life Centre',
    headCoach: 'Scott Arniel', record: '28-12-3', atsRecord: '22-21', ouRecord: '20-23',
    homeAtsRecord: '12-9', awayAtsRecord: '10-12', last5ATS: ['W', 'L', 'W', 'W', 'L'],
    avgPointsFor: 3.42, avgPointsAgainst: 2.58,
    injuries: [],
    trends: [
      { description: 'Jets are 14-6 ATS as home favorites', record: '14-6', winPct: 70, ats: true }
    ]
  },
  {
    id: 'edm', name: 'Edmonton Oilers', code: 'EDM', city: 'Edmonton', sport: 'NHL',
    conference: 'Western', division: 'Pacific', stadium: 'Rogers Place',
    headCoach: 'Kris Knoblauch', record: '25-14-4', atsRecord: '20-23', ouRecord: '24-19',
    homeAtsRecord: '11-10', awayAtsRecord: '9-13', last5ATS: ['L', 'L', 'W', 'L', 'W'],
    avgPointsFor: 3.56, avgPointsAgainst: 2.89,
    injuries: [
      { player: 'Connor McDavid', position: 'C', status: 'gtd', injury: 'Lower Body', impact: 'high' }
    ],
    trends: [
      { description: 'Oilers are 2-7 ATS without McDavid', record: '2-7', winPct: 22.2, ats: true }
    ]
  }
]

export const nhlMatchups: Matchup[] = [
  {
    id: 'nhl-1',
    sport: 'NHL',
    status: 'scheduled',
    gameTime: '2026-01-04T20:00:00Z',
    venue: 'Rogers Place',
    broadcast: 'ESPN+',
    home: { name: 'Edmonton Oilers', code: 'EDM', record: '25-14-4', spread: -1.5, spreadOdds: +140, ml: -145 },
    away: { name: 'Calgary Flames', code: 'CGY', record: '20-18-5', spread: 1.5, spreadOdds: -165, ml: +125 },
    lines: {
      spread: { home: -1.5, away: 1.5, homeOdds: +140, awayOdds: -165 },
      total: { line: 6.5, overOdds: -115, underOdds: -105 },
      moneyline: { home: -145, away: +125 },
      openSpread: -1.5,
      openTotal: 6.5
    },
    publicBetting: { spreadHome: 55, spreadAway: 45, moneyHome: 62, moneyAway: 38, overPct: 58, underPct: 42 },
    keyStats: [
      { stat: 'Goals Per Game', home: 3.56, away: 2.84, advantage: 'home' },
      { stat: 'Goals Against/Game', home: 2.89, away: 3.12, advantage: 'home' },
      { stat: 'Power Play %', home: 28.4, away: 19.2, advantage: 'home' }
    ],
    injuries: [
      { player: 'Connor McDavid', team: 'EDM', status: 'GTD (Lower Body)', impact: 'HUGE - Monitor closely' }
    ],
    trends: [
      { description: 'Battle of Alberta: Oilers are 5-2 ATS last 7 meetings', applies: 'home', record: '5-2' },
      { description: 'Oilers are 2-7 ATS without McDavid', applies: 'away', record: '2-7' }
    ],
    aiPick: {
      pick: 'Wait for McDavid status. If OUT, take CGY +1.5. If IN, take EDM ML.',
      confidence: 70,
      reasoning: 'McDavid is 35% of Oilers offense. Without him, this becomes a pick-em. With him, Oilers should dominate.'
    }
  }
]

// =============================================================================
// MLB DATA (Spring Training / Futures focused)
// =============================================================================

export const mlbTeams: Team[] = [
  {
    id: 'lad', name: 'Los Angeles Dodgers', code: 'LAD', city: 'Los Angeles', sport: 'MLB',
    conference: 'NL', division: 'West', stadium: 'Dodger Stadium',
    headCoach: 'Dave Roberts', record: '98-64', atsRecord: '84-78', ouRecord: '82-80',
    homeAtsRecord: '45-36', awayAtsRecord: '39-42', last5ATS: ['W', 'W', 'L', 'W', 'L'],
    avgPointsFor: 5.42, avgPointsAgainst: 3.89,
    injuries: [],
    trends: [
      { description: 'Dodgers are 12-4 ATS as home favorites -150+', record: '12-4', winPct: 75, ats: true }
    ]
  },
  {
    id: 'nyy', name: 'New York Yankees', code: 'NYY', city: 'New York', sport: 'MLB',
    conference: 'AL', division: 'East', stadium: 'Yankee Stadium',
    headCoach: 'Aaron Boone', record: '94-68', atsRecord: '80-82', ouRecord: '85-77',
    homeAtsRecord: '42-39', awayAtsRecord: '38-43', last5ATS: ['L', 'W', 'W', 'L', 'W'],
    avgPointsFor: 5.12, avgPointsAgainst: 4.02,
    injuries: [],
    trends: []
  }
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const getMatchupsBySport = (sport: Sport): Matchup[] => {
  switch (sport) {
    case 'NFL': return nflMatchups
    case 'NBA': return nbaMatchups
    case 'NHL': return nhlMatchups
    default: return []
  }
}

export const getTeamsBySport = (sport: Sport): Team[] => {
  switch (sport) {
    case 'NFL': return nflTeams
    case 'NBA': return nbaTeams
    case 'NHL': return nhlTeams
    case 'MLB': return mlbTeams
    default: return []
  }
}

export const getAllMatchups = (): Matchup[] => {
  return [...nflMatchups, ...nbaMatchups, ...nhlMatchups]
}

export const getMatchupsWithEdge = (): Matchup[] => {
  return getAllMatchups().filter(m => m.aiPick && m.aiPick.confidence >= 70)
}

export const getHighImpactInjuryGames = (): Matchup[] => {
  return getAllMatchups().filter(m => 
    m.injuries.some(i => i.impact.includes('MASSIVE') || i.impact.includes('HUGE'))
  )
}

export const getSharpMoneyGames = (): Matchup[] => {
  return getAllMatchups().filter(m => m.publicBetting.sharpMoney)
}

// Summary stats
export const sportsSummary = {
  totalMatchups: getAllMatchups().length,
  nflMatchups: nflMatchups.length,
  nbaMatchups: nbaMatchups.length,
  nhlMatchups: nhlMatchups.length,
  highConfidencePicks: getAllMatchups().filter(m => m.aiPick && m.aiPick.confidence >= 70).length,
  injuryAlerts: getAllMatchups().filter(m => m.injuries.length > 0).length,
  sharpMoneyGames: getSharpMoneyGames().length
}
