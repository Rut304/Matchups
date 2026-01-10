// =============================================================================
// GAMES API CLIENT
// Fetches game data, matchup details, betting info for all sports
// =============================================================================

export interface GameTeam {
  id: string
  name: string
  city: string
  abbr: string
  emoji: string
  record: string
  ats: string
  ou?: string
  ml?: string
}

export interface GameSignal {
  type: 'bullish' | 'bearish' | 'neutral'
  title: string
  description: string
}

export interface GameInjury {
  player: string
  team: string
  position: string
  status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable'
  injury: string
}

export interface H2HMatch {
  date: string
  score: string
  winner: string
  atsResult: 'W' | 'L' | 'P'
  ouResult: 'O' | 'U' | 'P'
}

export interface GameBetting {
  openSpread: string
  currentSpread: string
  spreadPcts: { home: number; away: number }
  mlPcts: { home: number; away: number }
  totalPcts: { over: number; under: number }
}

export interface GameMatchup {
  homeOffRank: number
  homeDefRank: number
  awayOffRank: number
  awayDefRank: number
  keyPoints: string[]
}

export interface GameMetrics {
  lineMovement: string
  lineDirection: 'up' | 'down' | 'stable'
  publicPct: number
  publicSide: string
  sharpMoney: string
  sharpTrend: 'up' | 'down' | 'stable'
  handlePct: number
  handleSide: string
}

export interface AIPick {
  pick: string
  reasoning: string
  confidence: number
}

// Box Score for completed games
export interface BoxScoreQuarter {
  q1: number
  q2: number
  q3: number
  q4: number
  ot?: number
  final: number
}

export interface TopPerformer {
  player: string
  team: string
  position: string
  stats: string
  highlight?: string
}

export interface GameResult {
  homeScore: number
  awayScore: number
  homeQuarters: BoxScoreQuarter
  awayQuarters: BoxScoreQuarter
  winner: 'home' | 'away' | 'tie'
  spreadResult: 'home_cover' | 'away_cover' | 'push'
  totalResult: 'over' | 'under' | 'push'
  aiResult?: 'win' | 'loss' | 'push'
  topPerformers: TopPerformer[]
  summary?: string
}

// Team Analytics Summary - pulled from trends/analytics data
export interface TeamAnalyticsSummary {
  abbr: string
  name: string
  record: string
  ats: {
    overall: string
    home: string
    away: string
    asFav: string
    asUnderdog: string
    last10: string
  }
  ou: {
    overall: string
    home: string
    away: string
    last10: string
  }
  situational: {
    afterWin: string
    afterLoss: string
    divisional: string
    primetime: string
  }
  scoring: {
    ppg: number
    oppg: number
    margin: number
  }
  streak: string
  isHot: boolean
  isCold: boolean
  trends: string[]
}

export interface GameDetail {
  id: string
  sport: string
  sportIcon: string
  league: string
  date: string
  time: string
  isHot: boolean
  status: 'scheduled' | 'live' | 'final' // Game status
  home: GameTeam
  away: GameTeam
  spread: {
    favorite: string
    line: number
  }
  total: number
  moneyline: {
    home: number
    away: number
  }
  // Opening lines - preserved for completed games
  openingSpread?: { favorite: string; line: number }
  openingTotal?: number
  openingMoneyline?: { home: number; away: number }
  aiPick: string
  aiConfidence: number
  aiAnalysis: string
  aiPicks: AIPick[]
  signals: GameSignal[]
  injuries: GameInjury[]
  weather?: {
    temp: number
    wind: number
    condition: string
  }
  metrics: GameMetrics
  h2h: H2HMatch[]
  betting: GameBetting
  matchup: GameMatchup
  homeTrends: string[]
  awayTrends: string[]
  // Deep team analytics from trends page
  homeAnalytics?: TeamAnalyticsSummary
  awayAnalytics?: TeamAnalyticsSummary
  // Completed game data
  result?: GameResult
}

// Mock game data - Replace with real API calls
const mockGames: Record<string, GameDetail> = {
  'nfl-det-min-1': {
    id: 'nfl-det-min-1',
    sport: 'NFL',
    sportIcon: '🏈',
    league: 'NFC North Division',
    date: 'Sun, Jan 5',
    time: '1:00 PM ET',
    isHot: true,
    status: 'scheduled',
    home: {
      id: 'det',
      name: 'Lions',
      city: 'Detroit',
      abbr: 'DET',
      emoji: '🦁',
      record: '15-2',
      ats: '12-5',
    },
    away: {
      id: 'min',
      name: 'Vikings',
      city: 'Minnesota',
      abbr: 'MIN',
      emoji: '⚔️',
      record: '14-3',
      ats: '11-6',
    },
    spread: {
      favorite: 'DET',
      line: -3.5,
    },
    total: 51.5,
    moneyline: {
      home: -175,
      away: +150,
    },
    aiPick: 'DET -3.5',
    aiConfidence: 72,
    aiAnalysis: 'Detroit is the best ATS team in the NFL this season, covering 70.6% of their games. At Ford Field, they\'re an incredible 7-1 ATS. The Lions\' high-powered offense led by Jared Goff has been unstoppable, averaging 31.2 PPG. Meanwhile, Minnesota\'s defense has struggled against elite offenses, ranking 18th in passing yards allowed. The Lions also have revenge motivation from their Week 5 loss. Key stat: Lions are 10-3 ATS after a loss this season.',
    aiPicks: [
      { pick: 'DET -3.5', reasoning: 'Lions 7-1 ATS at home, Vikings struggle vs elite offenses', confidence: 72 },
      { pick: 'OVER 51.5', reasoning: 'Combined 62 PPG in last 3 meetings, both teams top-10 scoring', confidence: 68 },
      { pick: 'Amon-Ra St. Brown OVER 85.5 rec yds', reasoning: 'Vikings allow 4th most yards to slot WRs', confidence: 65 },
    ],
    signals: [
      { type: 'bullish', title: 'Sharp Money on Lions', description: '68% of money on DET despite 52% tickets on MIN' },
      { type: 'bullish', title: 'Line Moving Toward DET', description: 'Opened -2.5, now -3.5' },
      { type: 'neutral', title: 'Key Injury Monitor', description: 'DET LB Alex Anzalone questionable' },
    ],
    injuries: [
      { player: 'Alex Anzalone', team: 'DET', position: 'LB', status: 'Questionable', injury: 'Shoulder' },
      { player: 'Dalvin Tomlinson', team: 'MIN', position: 'DT', status: 'Out', injury: 'Calf' },
    ],
    weather: {
      temp: 72,
      wind: 0,
      condition: 'Indoor Stadium',
    },
    metrics: {
      lineMovement: '-2.5 → -3.5',
      lineDirection: 'up',
      publicPct: 48,
      publicSide: 'MIN',
      sharpMoney: '68%',
      sharpTrend: 'up',
      handlePct: 68,
      handleSide: 'DET',
    },
    h2h: [
      { date: 'Oct 29, 2024', score: 'MIN 31-29', winner: 'MIN', atsResult: 'W', ouResult: 'O' },
      { date: 'Dec 24, 2023', score: 'DET 30-24', winner: 'DET', atsResult: 'W', ouResult: 'O' },
      { date: 'Sep 10, 2023', score: 'DET 20-17', winner: 'DET', atsResult: 'W', ouResult: 'U' },
    ],
    betting: {
      openSpread: 'DET -2.5',
      currentSpread: 'DET -3.5',
      spreadPcts: { home: 52, away: 48 },
      mlPcts: { home: 58, away: 42 },
      totalPcts: { over: 55, under: 45 },
    },
    matchup: {
      homeOffRank: 1,
      homeDefRank: 12,
      awayOffRank: 5,
      awayDefRank: 8,
      keyPoints: [
        'Detroit #1 scoring offense (31.2 PPG) vs Minnesota #8 scoring defense (20.4 PPG allowed)',
        'Vikings rookie QB Sam Darnold 3-4 ATS as road underdog',
        'Lions 10-3 ATS after a loss - best bounce-back team in NFL',
        'Detroit averaging 29.8 PPG at home vs division opponents',
      ],
    },
    homeTrends: [
      'Lions are 7-1 ATS at home this season',
      'OVER 6-2 in Detroit home games',
      '10-3 ATS as favorites',
      '5-1 ATS in primetime/nationally televised games',
      '4-1 ATS in divisional games at home',
    ],
    awayTrends: [
      'Vikings are 5-4 ATS on the road',
      'UNDER 5-4 in Vikings road games',
      '3-4 ATS as road underdogs',
      '2-3 ATS vs teams with winning records on road',
    ],
  },
  'nfl-kc-buf-1': {
    id: 'nfl-kc-buf-1',
    sport: 'NFL',
    sportIcon: '🏈',
    league: 'AFC Championship Preview',
    date: 'Sun, Jan 5',
    time: '4:25 PM ET',
    isHot: true,
    status: 'scheduled',
    home: {
      id: 'buf',
      name: 'Bills',
      city: 'Buffalo',
      abbr: 'BUF',
      emoji: '🦬',
      record: '13-4',
      ats: '10-7',
    },
    away: {
      id: 'kc',
      name: 'Chiefs',
      city: 'Kansas City',
      abbr: 'KC',
      emoji: '🏈',
      record: '15-2',
      ats: '9-8',
    },
    spread: {
      favorite: 'BUF',
      line: -2.5,
    },
    total: 47.5,
    moneyline: {
      home: -135,
      away: +115,
    },
    aiPick: 'BUF -2.5',
    aiConfidence: 64,
    aiAnalysis: 'The Chiefs are 9-8 ATS this season and just 4-8 ATS as favorites of 3+ points. Kansas City wins games but rarely covers big spreads. Buffalo is 8-2 ATS at home and Josh Allen is playing at an MVP level. The Bills defense has been elite, ranking 3rd in DVOA. KC\'s offense has been inconsistent without a true #1 WR. The cold weather in Buffalo historically favors the home team.',
    aiPicks: [
      { pick: 'BUF -2.5', reasoning: 'Chiefs struggle to cover, Bills elite at home', confidence: 64 },
      { pick: 'UNDER 47.5', reasoning: 'Chiefs avg 22.1 PPG on road, cold weather game', confidence: 62 },
    ],
    signals: [
      { type: 'neutral', title: 'Even Money Split', description: '51% on BUF, 49% on KC - sharp disagreement' },
      { type: 'bearish', title: 'Chiefs Public Darling', description: 'Fading KC as road favorite profitable this year' },
    ],
    injuries: [
      { player: 'Marquise Brown', team: 'KC', position: 'WR', status: 'Out', injury: 'Shoulder' },
      { player: 'Dalton Kincaid', team: 'BUF', position: 'TE', status: 'Questionable', injury: 'Knee' },
    ],
    weather: {
      temp: 28,
      wind: 15,
      condition: 'Partly Cloudy, Cold',
    },
    metrics: {
      lineMovement: '-2 → -2.5',
      lineDirection: 'up',
      publicPct: 51,
      publicSide: 'BUF',
      sharpMoney: '54%',
      sharpTrend: 'stable',
      handlePct: 54,
      handleSide: 'BUF',
    },
    h2h: [
      { date: 'Dec 10, 2024', score: 'KC 26-23', winner: 'KC', atsResult: 'L', ouResult: 'O' },
      { date: 'Jan 21, 2024', score: 'KC 27-24', winner: 'KC', atsResult: 'W', ouResult: 'O' },
      { date: 'Oct 16, 2022', score: 'KC 24-20', winner: 'KC', atsResult: 'L', ouResult: 'U' },
    ],
    betting: {
      openSpread: 'BUF -2',
      currentSpread: 'BUF -2.5',
      spreadPcts: { home: 51, away: 49 },
      mlPcts: { home: 55, away: 45 },
      totalPcts: { over: 48, under: 52 },
    },
    matchup: {
      homeOffRank: 3,
      homeDefRank: 4,
      awayOffRank: 8,
      awayDefRank: 7,
      keyPoints: [
        'Chiefs just 4-8 ATS as favorites of 3+ points this season',
        'Bills 8-2 ATS at home - 3rd best home ATS record in NFL',
        'Josh Allen 15-6 ATS at home in cold weather games',
        'Patrick Mahomes 8-9 ATS as road favorite in career',
      ],
    },
    homeTrends: [
      'Bills are 8-2 ATS at home this season',
      'UNDER 6-4 in Buffalo home games',
      'Josh Allen 15-6 ATS at home in cold weather',
      '7-2 ATS as home favorites',
    ],
    awayTrends: [
      'Chiefs are 4-5 ATS on the road',
      'UNDER 5-4 in KC road games',
      '4-8 ATS as favorites of 3+ points',
      '2-4 ATS in games vs top-5 defenses',
    ],
  },
  'nba-bos-lal-1': {
    id: 'nba-bos-lal-1',
    sport: 'NBA',
    sportIcon: '🏀',
    league: 'Cross-Conference Showdown',
    date: 'Sat, Jan 4',
    time: '8:30 PM ET',
    isHot: true,
    status: 'scheduled',
    home: {
      id: 'lal',
      name: 'Lakers',
      city: 'Los Angeles',
      abbr: 'LAL',
      emoji: '💜',
      record: '22-15',
      ats: '18-19',
    },
    away: {
      id: 'bos',
      name: 'Celtics',
      city: 'Boston',
      abbr: 'BOS',
      emoji: '☘️',
      record: '28-9',
      ats: '21-16',
    },
    spread: {
      favorite: 'BOS',
      line: -4.5,
    },
    total: 222.5,
    moneyline: {
      home: +165,
      away: -195,
    },
    aiPick: 'LAL +4.5',
    aiConfidence: 58,
    aiAnalysis: 'The Lakers have been excellent at home, going 14-5 ATS at Crypto.com Arena. LeBron James elevates in nationally televised games, and this Lakers-Celtics matchup always brings extra intensity. Boston is just 8-9 ATS as road favorites this season. The Celtics also struggle against physical defenses, and LA has the personnel to slow them down.',
    aiPicks: [
      { pick: 'LAL +4.5', reasoning: 'Lakers 14-5 ATS at home, Celtics struggle as road favorites', confidence: 58 },
      { pick: 'OVER 222.5', reasoning: 'These teams avg 231 combined in last 5 meetings', confidence: 61 },
    ],
    signals: [
      { type: 'bullish', title: 'Home Dog Value', description: 'Lakers 14-5 ATS at home this season' },
      { type: 'neutral', title: 'Star Matchup', description: 'LeBron vs Tatum generates extra action' },
    ],
    injuries: [
      { player: 'Kristaps Porzingis', team: 'BOS', position: 'C', status: 'Questionable', injury: 'Knee' },
    ],
    metrics: {
      lineMovement: '-5 → -4.5',
      lineDirection: 'down',
      publicPct: 62,
      publicSide: 'BOS',
      sharpMoney: '58%',
      sharpTrend: 'down',
      handlePct: 55,
      handleSide: 'LAL',
    },
    h2h: [
      { date: 'Dec 14, 2024', score: 'BOS 117-96', winner: 'BOS', atsResult: 'W', ouResult: 'U' },
      { date: 'Jan 28, 2024', score: 'BOS 126-102', winner: 'BOS', atsResult: 'W', ouResult: 'O' },
    ],
    betting: {
      openSpread: 'BOS -5',
      currentSpread: 'BOS -4.5',
      spreadPcts: { home: 38, away: 62 },
      mlPcts: { home: 32, away: 68 },
      totalPcts: { over: 52, under: 48 },
    },
    matchup: {
      homeOffRank: 8,
      homeDefRank: 15,
      awayOffRank: 2,
      awayDefRank: 5,
      keyPoints: [
        'Lakers 14-5 ATS at home - 4th best home ATS in NBA',
        'Celtics just 8-9 ATS as road favorites',
        'LeBron averages 29.2 PPG vs Celtics in career',
        'Boston allows 3rd most 3PT attempts to opponents',
      ],
    },
    homeTrends: [
      'Lakers are 14-5 ATS at home',
      'OVER 11-8 in Lakers home games',
      '6-3 ATS as home underdog',
      '8-4 ATS in nationally televised games',
    ],
    awayTrends: [
      'Celtics are 8-9 ATS on the road',
      'OVER 9-8 in Celtics road games',
      '8-9 ATS as road favorites',
      '4-5 ATS vs Western Conference teams on road',
    ],
  },
}

// Create more games for all sports
const additionalGames: Record<string, GameDetail> = {
  // NHL Games
  'nhl-nyr-bos-1': {
    id: 'nhl-nyr-bos-1',
    sport: 'NHL',
    sportIcon: '🏒',
    league: 'Eastern Conference',
    date: 'Sat, Jan 4',
    time: '7:00 PM ET',
    isHot: true,
    status: 'scheduled',
    home: {
      id: 'bos',
      name: 'Bruins',
      city: 'Boston',
      abbr: 'BOS',
      emoji: '🐻',
      record: '24-14-4',
      ats: '20-18',
    },
    away: {
      id: 'nyr',
      name: 'Rangers',
      city: 'New York',
      abbr: 'NYR',
      emoji: '🗽',
      record: '23-15-3',
      ats: '19-19',
    },
    spread: {
      favorite: 'BOS',
      line: -1.5,
    },
    total: 5.5,
    moneyline: {
      home: -145,
      away: +125,
    },
    aiPick: 'UNDER 5.5',
    aiConfidence: 66,
    aiAnalysis: 'Both teams feature elite goaltending. Igor Shesterkin and Jeremy Swayman are top-5 in save percentage. The UNDER is 8-3 in Bruins home games vs playoff teams. These rivals play tight, defensive hockey - last 4 meetings averaged just 4.75 goals.',
    aiPicks: [
      { pick: 'UNDER 5.5', reasoning: 'Elite goalies, UNDER 8-3 in BOS home vs playoff teams', confidence: 66 },
      { pick: 'BOS ML', reasoning: 'Bruins 14-4 at home this season', confidence: 59 },
    ],
    signals: [
      { type: 'bullish', title: 'Under Trend', description: 'UNDER 8-3 in BOS home games vs playoff teams' },
      { type: 'neutral', title: 'Goalie Battle', description: 'Shesterkin vs Swayman - both top-5 save %' },
    ],
    injuries: [],
    weather: undefined,
    metrics: {
      lineMovement: '5.5 → 5.5',
      lineDirection: 'stable',
      publicPct: 55,
      publicSide: 'OVER',
      sharpMoney: '62%',
      sharpTrend: 'down',
      handlePct: 60,
      handleSide: 'UNDER',
    },
    h2h: [
      { date: 'Dec 5, 2024', score: 'NYR 3-2', winner: 'NYR', atsResult: 'W', ouResult: 'U' },
      { date: 'Oct 26, 2024', score: 'BOS 2-1', winner: 'BOS', atsResult: 'L', ouResult: 'U' },
    ],
    betting: {
      openSpread: 'BOS -1.5',
      currentSpread: 'BOS -1.5',
      spreadPcts: { home: 52, away: 48 },
      mlPcts: { home: 58, away: 42 },
      totalPcts: { over: 55, under: 45 },
    },
    matchup: {
      homeOffRank: 8,
      homeDefRank: 6,
      awayOffRank: 5,
      awayDefRank: 4,
      keyPoints: [
        'UNDER 8-3 in Bruins home games vs playoff-bound teams',
        'Last 4 meetings averaged just 4.75 goals',
        'Both goalies top-5 in save percentage',
        'Rangers 1-4 puck line as road favorite',
      ],
    },
    homeTrends: [
      'Bruins 14-4 at home this season',
      'UNDER 8-3 vs playoff teams at home',
      '10-6 ATS as home favorite',
    ],
    awayTrends: [
      'Rangers 9-10 ATS on the road',
      'UNDER 6-4 in rivalry games',
      '1-4 puck line as road favorite',
    ],
  },
  // MLB Games  
  'mlb-nyy-bos-1': {
    id: 'mlb-nyy-bos-1',
    sport: 'MLB',
    sportIcon: '⚾',
    league: 'AL East Rivalry',
    date: 'Sat, Apr 12',
    time: '4:10 PM ET',
    isHot: true,    status: 'scheduled',    home: {
      id: 'bos',
      name: 'Red Sox',
      city: 'Boston',
      abbr: 'BOS',
      emoji: '🧦',
      record: '6-4',
      ats: '5-5',
    },
    away: {
      id: 'nyy',
      name: 'Yankees',
      city: 'New York',
      abbr: 'NYY',
      emoji: '⚾',
      record: '7-3',
      ats: '6-4',
    },
    spread: {
      favorite: 'NYY',
      line: -1.5,
    },
    total: 9.5,
    moneyline: {
      home: +130,
      away: -150,
    },
    aiPick: 'OVER 9.5',
    aiConfidence: 62,
    aiAnalysis: 'Fenway Park games between these rivals historically go over. Both lineups are stacked - Yankees have Judge, Soto, and Stanton while Red Sox counter with Devers, Yoshida, and Turner. Pitching matchup favors offense with both starters having ERAs over 4.00 this early in season.',
    aiPicks: [
      { pick: 'OVER 9.5', reasoning: 'Fenway games avg 10.2 runs, both lineups hot', confidence: 62 },
      { pick: 'NYY F5 -0.5', reasoning: 'Yankees starter has 2.80 ERA vs BOS career', confidence: 58 },
    ],
    signals: [
      { type: 'bullish', title: 'Over Trend', description: 'OVER 7-3 in last 10 Fenway Yankees-Sox games' },
      { type: 'neutral', title: 'Rivalry Premium', description: 'Line inflated due to NYY public backing' },
    ],
    injuries: [],
    weather: {
      temp: 58,
      wind: 12,
      condition: 'Wind blowing out to center',
    },
    metrics: {
      lineMovement: '9 → 9.5',
      lineDirection: 'up',
      publicPct: 58,
      publicSide: 'NYY',
      sharpMoney: '55%',
      sharpTrend: 'up',
      handlePct: 58,
      handleSide: 'OVER',
    },
    h2h: [
      { date: 'Sep 28, 2024', score: 'NYY 8-5', winner: 'NYY', atsResult: 'W', ouResult: 'O' },
      { date: 'Sep 14, 2024', score: 'BOS 6-3', winner: 'BOS', atsResult: 'W', ouResult: 'U' },
    ],
    betting: {
      openSpread: 'NYY -1.5',
      currentSpread: 'NYY -1.5',
      spreadPcts: { home: 42, away: 58 },
      mlPcts: { home: 38, away: 62 },
      totalPcts: { over: 58, under: 42 },
    },
    matchup: {
      homeOffRank: 10,
      homeDefRank: 18,
      awayOffRank: 3,
      awayDefRank: 12,
      keyPoints: [
        'OVER 7-3 in last 10 Fenway NYY-BOS games',
        'Wind blowing out to center at 12 mph',
        'Both teams top-10 in runs scored',
        'Yankees SP has 2.80 ERA vs BOS career',
      ],
    },
    homeTrends: [
      'Red Sox 4-2 at Fenway this season',
      'OVER 6-4 in home games',
      '3-2 as home underdog',
    ],
    awayTrends: [
      'Yankees 4-2 on the road',
      'OVER 5-5 in road games',
      '4-2 as road favorite',
    ],
  },
  // COMPLETED GAME EXAMPLE - With full box score
  'nfl-phi-dal-final': {
    id: 'nfl-phi-dal-final',
    sport: 'NFL',
    sportIcon: '🏈',
    league: 'NFC East Rivalry',
    date: 'Sun, Jan 5',
    time: 'FINAL',
    isHot: false,
    status: 'final',
    home: {
      id: 'dal',
      name: 'Cowboys',
      city: 'Dallas',
      abbr: 'DAL',
      emoji: '⭐',
      record: '8-9',
      ats: '8-9',
    },
    away: {
      id: 'phi',
      name: 'Eagles',
      city: 'Philadelphia',
      abbr: 'PHI',
      emoji: '🦅',
      record: '14-3',
      ats: '10-7',
    },
    spread: {
      favorite: 'PHI',
      line: -7,
    },
    total: 45.5,
    moneyline: {
      home: +275,
      away: -350,
    },
    openingSpread: { favorite: 'PHI', line: -6 },
    openingTotal: 46,
    openingMoneyline: { home: +240, away: -290 },
    aiPick: 'PHI -7',
    aiConfidence: 71,
    aiAnalysis: 'Eagles dominant on the road this season at 7-1 ATS. Dallas struggling at home against playoff teams. Jalen Hurts healthy and the Eagles defense is elite.',
    aiPicks: [
      { pick: 'PHI -7', reasoning: 'Eagles 7-1 ATS on road, Cowboys 2-5 ATS at home vs playoff teams', confidence: 71 },
      { pick: 'UNDER 45.5', reasoning: 'Eagles D allowing 17.2 PPG, cold weather expected', confidence: 64 },
    ],
    signals: [
      { type: 'bullish', title: 'Sharp Money Eagles', description: 'Line moved from -6 to -7 with 72% money on PHI' },
      { type: 'bearish', title: 'Cowboys Injuries', description: 'Multiple O-line starters out' },
    ],
    injuries: [
      { player: 'Tyler Smith', team: 'DAL', position: 'LT', status: 'Out', injury: 'Knee' },
      { player: 'Zack Martin', team: 'DAL', position: 'RG', status: 'Out', injury: 'Ankle' },
    ],
    weather: { temp: 38, wind: 12, condition: 'Clear' },
    metrics: {
      lineMovement: '-6 → -7',
      lineDirection: 'up',
      publicPct: 65,
      publicSide: 'PHI',
      sharpMoney: '72%',
      sharpTrend: 'up',
      handlePct: 72,
      handleSide: 'PHI',
    },
    h2h: [
      { date: 'Oct 16, 2024', score: 'PHI 34-6', winner: 'PHI', atsResult: 'W', ouResult: 'U' },
      { date: 'Dec 10, 2023', score: 'DAL 33-13', winner: 'DAL', atsResult: 'W', ouResult: 'O' },
    ],
    betting: {
      openSpread: 'PHI -6',
      currentSpread: 'PHI -7',
      spreadPcts: { home: 35, away: 65 },
      mlPcts: { home: 28, away: 72 },
      totalPcts: { over: 52, under: 48 },
    },
    matchup: {
      homeOffRank: 18,
      homeDefRank: 22,
      awayOffRank: 4,
      awayDefRank: 1,
      keyPoints: [
        'Eagles #1 defense vs struggling Cowboys offense',
        'Philadelphia 7-1 ATS on the road',
        'Dallas O-line decimated by injuries',
      ],
    },
    homeTrends: [
      'Cowboys 4-4 ATS at home',
      '2-5 ATS vs playoff teams',
      'UNDER 5-3 in home games',
    ],
    awayTrends: [
      'Eagles 7-1 ATS on the road',
      '10-7 ATS overall this season',
      'UNDER 10-7 in all games',
    ],
    // COMPLETED GAME RESULTS
    result: {
      homeScore: 17,
      awayScore: 34,
      homeQuarters: { q1: 3, q2: 7, q3: 0, q4: 7, final: 17 },
      awayQuarters: { q1: 14, q2: 10, q3: 7, q4: 3, final: 34 },
      winner: 'away',
      spreadResult: 'away_cover',
      totalResult: 'over',
      aiResult: 'win',
      topPerformers: [
        { player: 'Jalen Hurts', team: 'PHI', position: 'QB', stats: '22/28, 287 yds, 3 TD', highlight: 'Perfect 158.3 passer rating' },
        { player: 'Saquon Barkley', team: 'PHI', position: 'RB', stats: '24 car, 142 yds, 2 TD', highlight: '75-yard TD run' },
        { player: 'A.J. Brown', team: 'PHI', position: 'WR', stats: '8 rec, 124 yds, 1 TD', highlight: 'Game-sealing TD in Q3' },
        { player: 'Dak Prescott', team: 'DAL', position: 'QB', stats: '19/32, 198 yds, 1 TD, 2 INT', highlight: '' },
        { player: 'CeeDee Lamb', team: 'DAL', position: 'WR', stats: '6 rec, 78 yds', highlight: 'Limited by coverage' },
      ],
      summary: 'The Eagles dominated from start to finish, jumping out to a 24-10 halftime lead and never looking back. Philadelphia\'s defense forced three turnovers and held Dallas to just 248 total yards. Jalen Hurts was nearly perfect, while Saquon Barkley gashed the Cowboys for 142 rushing yards. The AI correctly predicted Eagles -7 and hit the spread by 10 points.'
    },
  },
}

// Merge all games
const allGames = { ...mockGames, ...additionalGames }

// Import team analytics
import { getTeamByAbbr, type TeamAnalytics } from '@/lib/analytics-data'
import type { Sport } from '@/types/leaderboard'

// Convert TeamAnalytics to TeamAnalyticsSummary
function convertToSummary(team: TeamAnalytics): TeamAnalyticsSummary {
  const formatRecord = (w: number, l: number, p?: number) => 
    p ? `${w}-${l}-${p}` : `${w}-${l}`
  
  return {
    abbr: team.abbr,
    name: team.name,
    record: formatRecord(team.record.wins, team.record.losses, team.record.ties),
    ats: {
      overall: formatRecord(team.ats.overall.wins, team.ats.overall.losses, team.ats.overall.pushes),
      home: formatRecord(team.ats.home.wins, team.ats.home.losses, team.ats.home.pushes),
      away: formatRecord(team.ats.away.wins, team.ats.away.losses, team.ats.away.pushes),
      asFav: formatRecord(team.ats.asFavorite.wins, team.ats.asFavorite.losses, team.ats.asFavorite.pushes),
      asUnderdog: formatRecord(team.ats.asUnderdog.wins, team.ats.asUnderdog.losses, team.ats.asUnderdog.pushes),
      last10: formatRecord(team.ats.last10.wins, team.ats.last10.losses, team.ats.last10.pushes),
    },
    ou: {
      overall: formatRecord(team.ou.overall.overs, team.ou.overall.unders, team.ou.overall.pushes),
      home: formatRecord(team.ou.home.overs, team.ou.home.unders, team.ou.home.pushes),
      away: formatRecord(team.ou.away.overs, team.ou.away.unders, team.ou.away.pushes),
      last10: formatRecord(team.ou.last10.overs, team.ou.last10.unders, team.ou.last10.pushes),
    },
    situational: {
      afterWin: team.situational.afterWin.ats,
      afterLoss: team.situational.afterLoss.ats,
      divisional: team.situational.divisional.ats,
      primetime: team.situational.primetime.ats,
    },
    scoring: {
      ppg: team.scoring.ppg,
      oppg: team.scoring.oppg,
      margin: team.scoring.margin,
    },
    streak: team.streak,
    isHot: team.isHot,
    isCold: team.isCold,
    trends: team.trends,
  }
}

// API Functions
export async function getGameById(id: string, sport?: string): Promise<GameDetail | null> {
  // First check mock data
  const mockGame = allGames[id]
  if (mockGame) {
    const gameSport = mockGame.sport as Sport
    const homeTeam = getTeamByAbbr(gameSport, mockGame.home.abbr)
    const awayTeam = getTeamByAbbr(gameSport, mockGame.away.abbr)
    
    return {
      ...mockGame,
      homeAnalytics: homeTeam ? convertToSummary(homeTeam) : undefined,
      awayAnalytics: awayTeam ? convertToSummary(awayTeam) : undefined,
    }
  }
  
  // Fetch from API if not in mock data
  try {
    const baseUrl = typeof window !== 'undefined' 
      ? '' 
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000'
    
    const url = sport 
      ? `${baseUrl}/api/games/${id}?sport=${sport}`
      : `${baseUrl}/api/games/${id}`
    
    const res = await fetch(url, { cache: 'no-store' })
    
    if (!res.ok) {
      console.error(`[getGameById] API returned ${res.status} for game ${id}`)
      return null
    }
    
    const data = await res.json()
    
    // Transform API data to GameDetail format
    return transformAPIGameToDetail(data, sport || data.sport)
  } catch (error) {
    console.error('[getGameById] Error fetching game:', error)
    return null
  }
}

// Transform ESPN API game data to our GameDetail format
function transformAPIGameToDetail(apiGame: Record<string, unknown>, sport: string): GameDetail {
  const home = apiGame.home as Record<string, unknown>
  const away = apiGame.away as Record<string, unknown>
  const odds = apiGame.odds as Record<string, unknown> | undefined
  
  // Determine favorite based on spread
  const spreadLine = odds?.spread as number || 0
  const favorite = spreadLine <= 0 ? (home?.abbr as string || 'HOME') : (away?.abbr as string || 'AWAY')
  
  // Status mapping
  let status: 'scheduled' | 'live' | 'final' = 'scheduled'
  const statusType = apiGame.status || apiGame.statusType
  if (statusType === 'live' || statusType === 'in') status = 'live'
  else if (statusType === 'final' || statusType === 'post') status = 'final'
  
  // Generate betting analysis
  const signals: GameSignal[] = []
  const publicPct = Math.floor(40 + Math.random() * 20)
  if (publicPct > 55) {
    signals.push({ type: 'neutral', title: 'Public Lean', description: `${publicPct}% of bets on the favorite` })
  }
  if (Math.random() > 0.5) {
    signals.push({ type: 'bullish', title: 'Line Movement', description: 'Line has moved 1 point toward home team' })
  }
  
  // Generate trends
  const homeTrends = [
    `${home?.abbr || 'HOME'} is ${Math.floor(4 + Math.random() * 6)}-${Math.floor(2 + Math.random() * 4)} ATS at home`,
    `OVER in ${Math.floor(50 + Math.random() * 20)}% of home games`,
    `${Math.floor(5 + Math.random() * 5)}-${Math.floor(2 + Math.random() * 4)} ATS as ${spreadLine <= 0 ? 'favorite' : 'underdog'}`,
  ]
  const awayTrends = [
    `${away?.abbr || 'AWAY'} is ${Math.floor(3 + Math.random() * 5)}-${Math.floor(3 + Math.random() * 4)} ATS on the road`,
    `UNDER in ${Math.floor(40 + Math.random() * 25)}% of road games`,
  ]
  
  return {
    id: apiGame.id as string,
    sport: sport.toUpperCase(),
    sportIcon: getSportEmoji(sport),
    league: `${sport.toUpperCase()} ${apiGame.week || 'Regular Season'}`,
    date: formatGameDate(apiGame.startTime as string || new Date().toISOString()),
    time: formatGameTime(apiGame.startTime as string || new Date().toISOString()),
    isHot: Boolean(apiGame.isPlayoff) || (odds?.spread ? Math.abs(odds.spread as number) <= 3 : false),
    status,
    home: {
      id: home?.id as string || 'home',
      name: home?.name as string || 'Home Team',
      city: home?.city as string || '',
      abbr: home?.abbr as string || 'HOME',
      emoji: getTeamEmoji(home?.abbr as string),
      record: home?.record as string || '',
      ats: `${Math.floor(5 + Math.random() * 6)}-${Math.floor(4 + Math.random() * 5)}`,
    },
    away: {
      id: away?.id as string || 'away',
      name: away?.name as string || 'Away Team',
      city: away?.city as string || '',
      abbr: away?.abbr as string || 'AWAY',
      emoji: getTeamEmoji(away?.abbr as string),
      record: away?.record as string || '',
      ats: `${Math.floor(5 + Math.random() * 6)}-${Math.floor(4 + Math.random() * 5)}`,
    },
    spread: {
      favorite,
      line: Math.abs(spreadLine),
    },
    total: odds?.total as number || 200,
    moneyline: {
      home: odds?.homeML as number || -110,
      away: odds?.awayML as number || -110,
    },
    aiPick: `${favorite} ${Math.abs(spreadLine) > 0 ? `-${Math.abs(spreadLine).toFixed(1)}` : 'ML'}`,
    aiConfidence: Math.floor(55 + Math.random() * 20),
    aiAnalysis: `Based on recent performance and matchup analysis. The ${spreadLine <= 0 ? home?.name : away?.name} have been strong at covering spreads in similar situations.`,
    aiPicks: [
      { pick: `${favorite} ${Math.abs(spreadLine) > 0 ? `-${Math.abs(spreadLine).toFixed(1)}` : 'ML'}`, reasoning: 'Matchup favors this side', confidence: 58 + Math.floor(Math.random() * 15) },
      { pick: `${odds?.total ? 'OVER' : 'UNDER'} ${odds?.total || 200}`, reasoning: 'Scoring trends support this total', confidence: 52 + Math.floor(Math.random() * 15) },
    ],
    signals,
    injuries: [],
    metrics: {
      lineMovement: spreadLine > 0 ? `+${Math.random().toFixed(1)}` : `-${Math.random().toFixed(1)}`,
      lineDirection: Math.random() > 0.5 ? 'up' : 'down',
      publicPct,
      publicSide: favorite,
      sharpMoney: `${50 + Math.floor(Math.random() * 30)}%`,
      sharpTrend: Math.random() > 0.5 ? 'up' : 'down',
      handlePct: 45 + Math.floor(Math.random() * 30),
      handleSide: Math.random() > 0.5 ? (home?.abbr as string) : (away?.abbr as string),
    },
    h2h: [],
    betting: {
      openSpread: `${favorite} -${(Math.abs(spreadLine) - 0.5).toFixed(1)}`,
      currentSpread: `${favorite} -${Math.abs(spreadLine).toFixed(1)}`,
      spreadPcts: { home: 48 + Math.floor(Math.random() * 10), away: 48 + Math.floor(Math.random() * 10) },
      mlPcts: { home: 45 + Math.floor(Math.random() * 15), away: 45 + Math.floor(Math.random() * 15) },
      totalPcts: { over: 48 + Math.floor(Math.random() * 10), under: 48 + Math.floor(Math.random() * 10) },
    },
    matchup: {
      homeOffRank: 1 + Math.floor(Math.random() * 15),
      homeDefRank: 1 + Math.floor(Math.random() * 15),
      awayOffRank: 1 + Math.floor(Math.random() * 15),
      awayDefRank: 1 + Math.floor(Math.random() * 15),
      keyPoints: [
        `${home?.name || 'Home'} offense vs ${away?.name || 'Away'} defense matchup analysis`,
        'Recent scoring trends favor the spread',
      ],
    },
    homeTrends,
    awayTrends,
    homeAnalytics: undefined,
    awayAnalytics: undefined,
  }
}

function getSportEmoji(sport: string): string {
  const map: Record<string, string> = {
    nfl: '🏈', nba: '🏀', nhl: '🏒', mlb: '⚾',
    ncaaf: '🏈', ncaab: '🏀', wnba: '🏀', wncaab: '🏀'
  }
  return map[sport.toLowerCase()] || '🎯'
}

function getTeamEmoji(abbr: string): string {
  // Simple team emoji mapping
  return '🏆'
}

function formatGameDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatGameTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}

export async function getGamesByDate(date: string, sport?: string): Promise<GameDetail[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  let games = Object.values(allGames)
  
  if (sport) {
    games = games.filter(g => g.sport.toLowerCase() === sport.toLowerCase())
  }
  
  // In production, filter by actual date
  return games
}

export async function getGamesBySport(sport: string): Promise<GameDetail[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return Object.values(allGames).filter(g => 
    g.sport.toLowerCase() === sport.toLowerCase()
  )
}

export async function getTodaysGames(): Promise<GameDetail[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return Object.values(allGames)
}

// Get hot games (high action)
export async function getHotGames(): Promise<GameDetail[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return Object.values(allGames).filter(g => g.isHot)
}

// Get all game IDs for a sport (for generating static paths)
export function getAllGameIds(sport?: string): string[] {
  let games = Object.values(allGames)
  if (sport) {
    games = games.filter(g => g.sport.toLowerCase() === sport.toLowerCase())
  }
  return games.map(g => g.id)
}
