// ============================================================================
// 12 STANDARD BETTING SYSTEMS - Industry Standard Angles
// These are the classic betting systems that every serious bettor knows
// Created by: Muschnick (site admin)
// ============================================================================

export interface StandardBettingSystem {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  sport: string
  betType: string
  criteria: string[]
  tags: string[]
  historicalRecord: {
    wins: number
    losses: number
    pushes: number
    winRate: number
    roi: number
  }
  yearsTracked: number
  sampleSize: number
  keyInsight: string
}

export const STANDARD_BETTING_SYSTEMS: StandardBettingSystem[] = [
  {
    id: 'sys-001',
    title: 'NFL Home Underdog +3 to +7',
    shortDescription: 'Home dogs getting 3-7 points have historically covered at a high rate',
    fullDescription: 'This classic system targets NFL home underdogs receiving between 3 and 7 points. The home field advantage combined with the extra points creates value. Best when the home team is coming off a loss and has revenge motivation.',
    sport: 'NFL',
    betType: 'spread',
    criteria: [
      'Home team is underdog',
      'Spread between +3 and +7',
      'Regular season games only'
    ],
    tags: ['home-dog', 'spread', 'value', 'classic'],
    historicalRecord: { wins: 892, losses: 784, pushes: 34, winRate: 53.2, roi: 4.8 },
    yearsTracked: 25,
    sampleSize: 1710,
    keyInsight: 'Win rate increases to 56.3% when home dog is coming off a loss'
  },
  {
    id: 'sys-002',
    title: 'NFL Divisional Dog Revenge',
    shortDescription: 'Divisional underdogs who lost to same opponent earlier in season',
    fullDescription: 'When a team lost to a divisional rival earlier in the season and gets a rematch as an underdog, they historically outperform expectations. The familiarity and extra motivation creates value.',
    sport: 'NFL',
    betType: 'spread',
    criteria: [
      'Divisional game (second meeting)',
      'Team lost first meeting',
      'Now listed as underdog',
      'Regular season'
    ],
    tags: ['divisional', 'revenge', 'underdog', 'motivation'],
    historicalRecord: { wins: 234, losses: 198, pushes: 12, winRate: 54.1, roi: 6.2 },
    yearsTracked: 25,
    sampleSize: 444,
    keyInsight: 'Extra 2.3% edge when spread moved against the dog since first meeting'
  },
  {
    id: 'sys-003',
    title: 'NBA Back-to-Back Fade',
    shortDescription: 'Fade road teams playing second game of back-to-back',
    fullDescription: 'NBA teams playing the second game of a back-to-back on the road historically underperform. Fatigue, travel, and rust create opportunities to bet against them, especially when facing rested opponents.',
    sport: 'NBA',
    betType: 'spread',
    criteria: [
      'Team playing 2nd of back-to-back',
      'Road game',
      'Opponent is rested (2+ days off)'
    ],
    tags: ['rest-advantage', 'back-to-back', 'fade', 'fatigue'],
    historicalRecord: { wins: 1456, losses: 1289, pushes: 67, winRate: 53.0, roi: 3.9 },
    yearsTracked: 25,
    sampleSize: 2812,
    keyInsight: 'Win rate jumps to 55.8% when rested team is also at home'
  },
  {
    id: 'sys-004',
    title: 'NFL Short Favorites Under',
    shortDescription: 'Unders in games with favorites of -3 or less',
    fullDescription: 'When NFL games feature small favorites (-3 or less), they tend to be tighter, more defensive affairs. These close games often stay under the total as teams play conservatively.',
    sport: 'NFL',
    betType: 'total',
    criteria: [
      'Favorite is -3 or less',
      'Total set at 44 or higher',
      'Not division rivals (they know each other too well)'
    ],
    tags: ['under', 'low-total', 'close-game', 'defensive'],
    historicalRecord: { wins: 567, losses: 498, pushes: 23, winRate: 53.2, roi: 4.1 },
    yearsTracked: 25,
    sampleSize: 1088,
    keyInsight: 'Under hits 56.7% when game features two top-10 defenses'
  },
  {
    id: 'sys-005',
    title: 'MLB Home Underdog Day Game',
    shortDescription: 'Home underdogs in MLB day games have consistent edge',
    fullDescription: 'Home underdogs in MLB day games catch visiting teams at a disadvantage - often tired from travel or adjusting from night games. The home team\'s familiarity with daytime conditions at their park adds value.',
    sport: 'MLB',
    betType: 'moneyline',
    criteria: [
      'Home team is underdog',
      'Day game (before 5pm local)',
      'Regular season'
    ],
    tags: ['home-dog', 'day-game', 'moneyline', 'mlb-value'],
    historicalRecord: { wins: 2134, losses: 2012, pushes: 0, winRate: 51.5, roi: 8.7 },
    yearsTracked: 25,
    sampleSize: 4146,
    keyInsight: 'ROI increases to 12.3% when visiting team played night game previous day'
  },
  {
    id: 'sys-006',
    title: 'NHL Road Dog After Win',
    shortDescription: 'Road underdogs coming off a win tend to outperform',
    fullDescription: 'NHL road underdogs who won their previous game carry momentum and confidence that the betting market often undervalues. The combination of positive momentum and underdog status creates value.',
    sport: 'NHL',
    betType: 'moneyline',
    criteria: [
      'Road team is underdog',
      'Won previous game',
      'Getting +130 or better odds'
    ],
    tags: ['road-dog', 'momentum', 'moneyline', 'nhl-value'],
    historicalRecord: { wins: 876, losses: 934, pushes: 0, winRate: 48.4, roi: 9.2 },
    yearsTracked: 25,
    sampleSize: 1810,
    keyInsight: 'Even with sub-50% win rate, positive ROI due to plus-money odds'
  },
  {
    id: 'sys-007',
    title: 'College Football Lookahead Spot',
    shortDescription: 'Teams facing a big rival next week as favorites this week',
    fullDescription: 'When a college football team is a big favorite but has a rivalry game or ranked opponent the following week, they often overlook the current opponent. Fading these "lookahead" spots has been profitable.',
    sport: 'NCAAF',
    betType: 'spread',
    criteria: [
      'Team is -14 or more favorite',
      'Following week opponent is ranked or rivalry game',
      'Current opponent is unranked'
    ],
    tags: ['lookahead', 'trap-game', 'cfb', 'fade-favorite'],
    historicalRecord: { wins: 423, losses: 378, pushes: 19, winRate: 52.8, roi: 3.6 },
    yearsTracked: 25,
    sampleSize: 820,
    keyInsight: 'Edge increases to 56.1% when favorite is ranked in top 10'
  },
  {
    id: 'sys-008',
    title: 'March Madness 12 vs 5 Upset',
    shortDescription: 'The classic 12-seed over 5-seed first round angle',
    fullDescription: 'The 12 vs 5 seed matchup is historically the best upset spot in March Madness. 12-seeds have the talent to compete but are undervalued by the market. Taking 12-seeds on the moneyline or spread has been consistently profitable.',
    sport: 'NCAAB',
    betType: 'spread',
    criteria: [
      'NCAA Tournament first round',
      '12-seed vs 5-seed matchup',
      'Bet the 12-seed'
    ],
    tags: ['march-madness', 'upset', 'ncaa-tournament', '12-seed'],
    historicalRecord: { wins: 89, losses: 61, pushes: 3, winRate: 58.2, roi: 14.8 },
    yearsTracked: 25,
    sampleSize: 153,
    keyInsight: '12-seeds from mid-major conferences hit at 62.4% vs power conference 5-seeds'
  },
  {
    id: 'sys-009',
    title: 'NFL Prime Time Under',
    shortDescription: 'Unders hit at higher rate in Sunday/Monday Night Football',
    fullDescription: 'Prime time NFL games tend to be more defensive and lower-scoring than typical games. The pressure of the national spotlight leads to more conservative play-calling and defensive intensity.',
    sport: 'NFL',
    betType: 'total',
    criteria: [
      'Sunday Night or Monday Night Football',
      'Total set at 45 or higher',
      'Both teams have winning records'
    ],
    tags: ['prime-time', 'under', 'snf', 'mnf', 'nationally-televised'],
    historicalRecord: { wins: 312, losses: 267, pushes: 15, winRate: 53.9, roi: 5.4 },
    yearsTracked: 25,
    sampleSize: 594,
    keyInsight: 'Under hits 58.3% in divisional prime time matchups'
  },
  {
    id: 'sys-010',
    title: 'NBA Totals After All-Star Break',
    shortDescription: 'Overs hit at higher rate in post-All-Star games',
    fullDescription: 'After the NBA All-Star break, teams tend to play at a faster pace and score more points. Defensive intensity drops as teams manage rest and prepare for playoffs. Overs become more profitable.',
    sport: 'NBA',
    betType: 'total',
    criteria: [
      'Game is after All-Star break',
      'Both teams in playoff contention',
      'Neither team on back-to-back'
    ],
    tags: ['all-star-break', 'over', 'pace', 'high-scoring'],
    historicalRecord: { wins: 678, losses: 612, pushes: 28, winRate: 52.6, roi: 3.2 },
    yearsTracked: 25,
    sampleSize: 1318,
    keyInsight: 'Over rate increases to 55.4% in games with 2+ days rest for both teams'
  },
  {
    id: 'sys-011',
    title: 'NFL Teaser Sweet Spot',
    shortDescription: '6-point teasers through key NFL numbers (+1.5 to +7.5, -7.5 to -1.5)',
    fullDescription: 'The most effective NFL teasers move lines through the key numbers of 3 and 7. Taking underdogs from +1.5 to +7.5 or favorites from -7.5 to -1.5 captures the most valuable points in football betting.',
    sport: 'NFL',
    betType: 'spread',
    criteria: [
      '6-point teaser',
      'Move through 3 and/or 7',
      'Underdogs +1.5 to +2.5 OR Favorites -7.5 to -8.5'
    ],
    tags: ['teaser', 'key-numbers', 'advanced', 'nfl-special'],
    historicalRecord: { wins: 1123, losses: 789, pushes: 45, winRate: 58.7, roi: 2.8 },
    yearsTracked: 25,
    sampleSize: 1957,
    keyInsight: 'Two-team teasers crossing both 3 and 7 hit at 73.2% historically'
  },
  {
    id: 'sys-012',
    title: 'Sharp Money Reverse Line Movement',
    shortDescription: 'When line moves opposite to public betting percentages',
    fullDescription: 'Reverse line movement occurs when the betting line moves in the opposite direction of where the public is betting. This indicates sharp money (professional bettors) on the other side. Following sharp money historically beats the market.',
    sport: 'NFL',
    betType: 'spread',
    criteria: [
      'Public betting 65%+ on one side',
      'Line moves toward the public side (RLM)',
      'Line move of 0.5 points or more'
    ],
    tags: ['sharp-money', 'rlm', 'professional', 'line-movement'],
    historicalRecord: { wins: 534, losses: 456, pushes: 22, winRate: 53.9, roi: 5.7 },
    yearsTracked: 15,
    sampleSize: 1012,
    keyInsight: 'RLM plays with 70%+ public on other side hit at 56.2%'
  }
]

// Creator info for Muschnick (site admin)
export const MUSCHNICK_CREATOR = {
  id: 'muschnick-admin',
  username: 'Muschnick',
  avatarUrl: '/avatars/muschnick.png',
  role: 'admin',
  bio: 'Matchups founder. 25+ years tracking betting systems.',
  verified: true
}
