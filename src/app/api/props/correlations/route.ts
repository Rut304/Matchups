import { NextResponse } from 'next/server'

// Correlation types
interface PropCorrelation {
  id: string
  sport: string
  prop1: {
    playerId: string
    playerName: string
    team: string
    propType: string
    line: number
  }
  prop2: {
    playerId: string
    playerName: string
    team: string
    propType: string
    line: number
  }
  correlationType: 'positive' | 'negative' | 'neutral'
  correlationStrength: number // -100 to 100
  sampleSize: number
  hitRateBoth: number // % of time both hit together
  description: string
  insight: string
  parlayBoost: number // Expected value boost when parlayed
}

interface GameCorrelations {
  gameId: string
  homeTeam: string
  awayTeam: string
  correlations: PropCorrelation[]
}

// Known correlation patterns in sports betting
const CORRELATION_PATTERNS = {
  NFL: [
    {
      pattern: 'qb_wr_positive',
      description: 'QB passing yards correlates with WR1/WR2 receiving yards',
      strength: 75,
      insight: 'When QBs exceed passing yards, their top receivers almost always benefit'
    },
    {
      pattern: 'game_total_scoring',
      description: 'High game totals correlate with multiple player overs',
      strength: 80,
      insight: 'Games projected for high scoring see more individual stat overs hit'
    },
    {
      pattern: 'rb_negative_passing',
      description: 'RB rushing yards often negative correlation with passing yards',
      strength: -45,
      insight: 'Heavy rushing games mean fewer passing opportunities'
    },
    {
      pattern: 'te_redzone_td',
      description: 'TE receiving yards correlate with anytime TD scorer',
      strength: 55,
      insight: 'TEs with higher yards often find the end zone'
    },
    {
      pattern: 'defense_under',
      description: 'Elite pass rush correlates with QB unders',
      strength: 65,
      insight: 'Strong defenses suppress opposing QB stats'
    },
  ],
  NBA: [
    {
      pattern: 'pra_positive',
      description: 'Points correlate strongly with PRA (Points+Rebounds+Assists)',
      strength: 90,
      insight: 'Players hitting points overs typically exceed PRA lines'
    },
    {
      pattern: 'blowout_negative',
      description: 'Star player props negatively correlate in blowouts',
      strength: -70,
      insight: 'Large leads lead to bench players, hurting star prop overs'
    },
    {
      pattern: 'pace_all_stats',
      description: 'High pace games correlate with all stat overs',
      strength: 75,
      insight: 'Fast-paced games produce more stats across the board'
    },
    {
      pattern: 'assist_rebounds_pg',
      description: 'Point guard assists correlate with team rebounds',
      strength: 50,
      insight: 'More assists = more made shots = more defensive rebounds'
    },
    {
      pattern: 'center_blocks_rebounds',
      description: 'Center blocks correlate with rebounds',
      strength: 65,
      insight: 'Active rim protectors often collect rebounds'
    },
  ],
  MLB: [
    {
      pattern: 'pitcher_strikeouts_under',
      description: 'High K pitchers correlate with game unders',
      strength: 55,
      insight: 'Dominant pitching limits scoring opportunities'
    },
    {
      pattern: 'leadoff_runs',
      description: 'Leadoff hitter on-base correlates with runs scored',
      strength: 70,
      insight: 'Leadoff getting on means more RBI opportunities'
    },
    {
      pattern: 'cleanup_rbi_hrs',
      description: 'Cleanup hitter HRs correlate with RBIs',
      strength: 85,
      insight: 'HRs from 3-4-5 hitters usually drive in multiple runs'
    },
    {
      pattern: 'wind_totals',
      description: 'Wind direction correlates with game totals',
      strength: 60,
      insight: 'Wind blowing out = more HRs and runs'
    },
  ],
  NHL: [
    {
      pattern: 'goalie_saves_shots',
      description: 'Goalie saves correlate with opposing shots on goal',
      strength: 95,
      insight: 'More shots = more save opportunities'
    },
    {
      pattern: 'pp_goals_assists',
      description: 'Power play goals correlate with PP assists',
      strength: 80,
      insight: 'PP specialists benefit from man advantage together'
    },
    {
      pattern: 'line_chemistry',
      description: 'Linemates stats correlate strongly',
      strength: 75,
      insight: 'Players on same line hit overs/unders together'
    },
  ],
}

// Generate correlations for a game
function generateGameCorrelations(gameId: string, sport: string, homeTeam: string, awayTeam: string): PropCorrelation[] {
  const patterns = CORRELATION_PATTERNS[sport as keyof typeof CORRELATION_PATTERNS] || []
  const correlations: PropCorrelation[] = []
  
  // Sample players for each team (in production, this would come from real data)
  const samplePlayers: Record<string, { id: string; name: string; team: string; position: string }[]> = {
    NFL: [
      { id: 'mahomes', name: 'Patrick Mahomes', team: 'KC', position: 'QB' },
      { id: 'kelce', name: 'Travis Kelce', team: 'KC', position: 'TE' },
      { id: 'worthy', name: 'Xavier Worthy', team: 'KC', position: 'WR' },
      { id: 'allen', name: 'Josh Allen', team: 'BUF', position: 'QB' },
      { id: 'diggs', name: 'Stefon Diggs', team: 'BUF', position: 'WR' },
      { id: 'cook', name: 'James Cook', team: 'BUF', position: 'RB' },
    ],
    NBA: [
      { id: 'lebron', name: 'LeBron James', team: 'LAL', position: 'SF' },
      { id: 'ad', name: 'Anthony Davis', team: 'LAL', position: 'PF' },
      { id: 'tatum', name: 'Jayson Tatum', team: 'BOS', position: 'SF' },
      { id: 'brown', name: 'Jaylen Brown', team: 'BOS', position: 'SG' },
      { id: 'jokic', name: 'Nikola Jokic', team: 'DEN', position: 'C' },
      { id: 'murray', name: 'Jamal Murray', team: 'DEN', position: 'PG' },
    ],
    MLB: [
      { id: 'ohtani', name: 'Shohei Ohtani', team: 'LAD', position: 'DH' },
      { id: 'betts', name: 'Mookie Betts', team: 'LAD', position: 'RF' },
      { id: 'judge', name: 'Aaron Judge', team: 'NYY', position: 'RF' },
      { id: 'soto', name: 'Juan Soto', team: 'NYY', position: 'LF' },
    ],
    NHL: [
      { id: 'mcdavid', name: 'Connor McDavid', team: 'EDM', position: 'C' },
      { id: 'draisaitl', name: 'Leon Draisaitl', team: 'EDM', position: 'C' },
      { id: 'mackinnon', name: 'Nathan MacKinnon', team: 'COL', position: 'C' },
      { id: 'makar', name: 'Cale Makar', team: 'COL', position: 'D' },
    ],
  }
  
  const players = samplePlayers[sport] || []
  
  // Generate correlations based on patterns
  patterns.forEach((pattern, idx) => {
    if (players.length >= 2) {
      const player1 = players[idx % players.length]
      const player2 = players[(idx + 1) % players.length]
      
      correlations.push({
        id: `${gameId}-${pattern.pattern}-${idx}`,
        sport,
        prop1: {
          playerId: player1.id,
          playerName: player1.name,
          team: player1.team,
          propType: getPropTypeForPosition(player1.position, sport),
          line: getDefaultLine(player1.position, sport),
        },
        prop2: {
          playerId: player2.id,
          playerName: player2.name,
          team: player2.team,
          propType: getPropTypeForPosition(player2.position, sport),
          line: getDefaultLine(player2.position, sport),
        },
        correlationType: pattern.strength > 0 ? 'positive' : pattern.strength < 0 ? 'negative' : 'neutral',
        correlationStrength: pattern.strength,
        sampleSize: Math.floor(Math.random() * 50) + 20,
        hitRateBoth: Math.floor(Math.random() * 30) + 40,
        description: pattern.description,
        insight: pattern.insight,
        parlayBoost: Math.round((Math.abs(pattern.strength) / 100) * 15),
      })
    }
  })
  
  return correlations
}

function getPropTypeForPosition(position: string, sport: string): string {
  const propTypes: Record<string, Record<string, string>> = {
    NFL: { QB: 'Passing Yards', WR: 'Receiving Yards', RB: 'Rushing Yards', TE: 'Receiving Yards' },
    NBA: { PG: 'Assists', SG: 'Points', SF: 'Points', PF: 'Rebounds', C: 'Rebounds' },
    MLB: { P: 'Strikeouts', DH: 'Total Bases', RF: 'Hits', LF: 'Hits' },
    NHL: { C: 'Points', D: 'Blocked Shots', G: 'Saves' },
  }
  return propTypes[sport]?.[position] || 'Points'
}

function getDefaultLine(position: string, sport: string): number {
  const lines: Record<string, Record<string, number>> = {
    NFL: { QB: 275.5, WR: 65.5, RB: 55.5, TE: 45.5 },
    NBA: { PG: 8.5, SG: 22.5, SF: 25.5, PF: 8.5, C: 10.5 },
    MLB: { P: 6.5, DH: 1.5, RF: 0.5, LF: 0.5 },
    NHL: { C: 0.5, D: 2.5, G: 27.5 },
  }
  return lines[sport]?.[position] || 0.5
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'NFL'
  const gameId = searchParams.get('gameId')
  const propType = searchParams.get('propType') // Filter by prop type
  
  try {
    // Generate sample correlations
    const games: GameCorrelations[] = [
      {
        gameId: gameId || 'game-1',
        homeTeam: sport === 'NFL' ? 'Chiefs' : sport === 'NBA' ? 'Lakers' : sport === 'MLB' ? 'Dodgers' : 'Oilers',
        awayTeam: sport === 'NFL' ? 'Bills' : sport === 'NBA' ? 'Celtics' : sport === 'MLB' ? 'Yankees' : 'Avalanche',
        correlations: generateGameCorrelations(gameId || 'game-1', sport, '', ''),
      },
    ]
    
    // Add top correlated parlays
    const topParlays = [
      {
        id: 'parlay-1',
        name: 'Stack Attack',
        description: `${sport} QB + WR1 Stack`,
        legs: games[0].correlations.slice(0, 2).map(c => ({
          player: c.prop1.playerName,
          prop: c.prop1.propType,
          line: c.prop1.line,
          pick: 'Over',
        })),
        correlationBoost: 12,
        historicalHitRate: 58,
      },
      {
        id: 'parlay-2',
        name: 'Game Script',
        description: 'High-scoring game correlation',
        legs: games[0].correlations.slice(1, 3).map(c => ({
          player: c.prop2.playerName,
          prop: c.prop2.propType,
          line: c.prop2.line,
          pick: 'Over',
        })),
        correlationBoost: 8,
        historicalHitRate: 52,
      },
    ]
    
    // Correlation insights
    const insights = CORRELATION_PATTERNS[sport as keyof typeof CORRELATION_PATTERNS]?.map(p => ({
      pattern: p.pattern,
      description: p.description,
      strength: p.strength,
      insight: p.insight,
    })) || []
    
    return NextResponse.json({
      sport,
      games,
      topParlays,
      insights,
      meta: {
        totalCorrelations: games.reduce((sum, g) => sum + g.correlations.length, 0),
        strongCorrelations: games.reduce((sum, g) => sum + g.correlations.filter(c => Math.abs(c.correlationStrength) > 60).length, 0),
      },
    })
  } catch (error) {
    console.error('Prop correlations API error:', error)
    return NextResponse.json({ error: 'Failed to fetch correlations' }, { status: 500 })
  }
}
