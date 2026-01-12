// ============================================================================
// BANKROLL MANAGEMENT & STAKING SYSTEMS
// Sourced from bettoringreen.com - professional staking strategies
// These systems define HOW MUCH to bet, not WHAT to bet on
// ============================================================================

export interface StakingSystem {
  id: string
  name: string
  category: 'progressive' | 'fixed' | 'proportional' | 'recovery' | 'value'
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  description: string
  howItWorks: string
  formula?: string
  pros: string[]
  cons: string[]
  bestFor: string[]
  example: {
    bankroll: number
    sequence: { bet: number, outcome: 'win' | 'loss', bankroll: number }[]
  }
  source: string
  sourceUrl: string
  warningMessage?: string
}

export const BANKROLL_MANAGEMENT_SYSTEMS: StakingSystem[] = [
  {
    id: 'flat-betting',
    name: 'Flat Betting',
    category: 'fixed',
    difficulty: 'beginner',
    riskLevel: 'low',
    description: 'Bet the same amount (usually 1-5% of bankroll) on every wager regardless of confidence or odds.',
    howItWorks: 'Choose a fixed percentage of your starting bankroll (typically 1-3% for conservative, 3-5% for moderate). Bet this exact amount on every play. Do not adjust bet size based on wins/losses.',
    formula: 'Bet = Bankroll × Unit Percentage (e.g., $1000 × 2% = $20 per bet)',
    pros: [
      'Simple to implement and track',
      'Protects bankroll during losing streaks',
      'Removes emotional betting decisions',
      'Sustainable for long-term betting'
    ],
    cons: [
      'Doesn\'t capitalize on high-confidence plays',
      'Slower bankroll growth',
      'May feel boring to some bettors'
    ],
    bestFor: ['Beginning bettors', 'Those who struggle with bankroll discipline', 'Long-term grinders'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 20, outcome: 'win', bankroll: 1020 },
        { bet: 20, outcome: 'loss', bankroll: 1000 },
        { bet: 20, outcome: 'win', bankroll: 1020 },
        { bet: 20, outcome: 'loss', bankroll: 1000 },
        { bet: 20, outcome: 'win', bankroll: 1020 }
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/flat/'
  },
  {
    id: 'kelly-criterion',
    name: 'Kelly Criterion',
    category: 'proportional',
    difficulty: 'advanced',
    riskLevel: 'medium',
    description: 'Mathematical formula that determines optimal bet size based on your edge and the odds being offered.',
    howItWorks: 'Calculate your perceived probability of winning. Compare to implied odds probability. Apply Kelly formula to determine optimal stake. Most pros use "fractional Kelly" (25-50%) to reduce variance.',
    formula: 'Kelly % = (bp - q) / b, where b = decimal odds - 1, p = win probability, q = 1 - p',
    pros: [
      'Mathematically optimal for long-term growth',
      'Automatically scales bets to edge size',
      'Protects against over-betting weak edges',
      'Used by professional gamblers and investors'
    ],
    cons: [
      'Requires accurate probability assessment',
      'Full Kelly has high variance',
      'Complex calculations for each bet',
      'Overestimates can lead to large losses'
    ],
    bestFor: ['Advanced bettors with proven edge', 'Those who can accurately assess probabilities', 'Long-term bankroll maximizers'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 50, outcome: 'win', bankroll: 1095 },   // 5% Kelly on +110 bet
        { bet: 32, outcome: 'loss', bankroll: 1063 },  // 3% Kelly on -130 bet
        { bet: 53, outcome: 'win', bankroll: 1163 },   // 5% Kelly on +110 bet
        { bet: 35, outcome: 'loss', bankroll: 1128 },  // 3% Kelly
        { bet: 56, outcome: 'win', bankroll: 1234 }    // 5% Kelly
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/kelly-criterion/'
  },
  {
    id: 'martingale',
    name: 'Martingale System',
    category: 'recovery',
    difficulty: 'beginner',
    riskLevel: 'extreme',
    description: 'Double your bet after every loss to recover previous losses. Reset to base bet after a win.',
    howItWorks: 'Start with base bet (e.g., $10). After any loss, double your bet. After any win, return to base bet. The idea is that one win recovers all previous losses plus profit.',
    formula: 'Next Bet = Previous Bet × 2 (after loss) or Base Bet (after win)',
    pros: [
      'Simple to understand',
      'Works in theory with unlimited bankroll',
      'Wins feel consistent short-term'
    ],
    cons: [
      'Can wipe out bankroll completely',
      'Requires massive bankroll for extended losing streaks',
      'Betting limits prevent recovery',
      '8 consecutive losses on $10 base = $2,550 total lost'
    ],
    bestFor: ['No one - included for educational purposes only'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 10, outcome: 'loss', bankroll: 990 },
        { bet: 20, outcome: 'loss', bankroll: 970 },
        { bet: 40, outcome: 'loss', bankroll: 930 },
        { bet: 80, outcome: 'loss', bankroll: 850 },
        { bet: 160, outcome: 'win', bankroll: 1010 }  // Finally recovers + $10 profit
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/martingale/',
    warningMessage: '⚠️ EXTREME RISK: The Martingale system is mathematically flawed for sports betting. A 6-loss streak on -110 odds (common) requires 64x your base bet. Not recommended for real bankroll management.'
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci Betting System',
    category: 'recovery',
    difficulty: 'intermediate',
    riskLevel: 'high',
    description: 'Increase bets following the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13...) after losses. Move back 2 steps after wins.',
    howItWorks: 'Start at position 1 in Fibonacci sequence. After loss, move to next number. After win, move back 2 positions. Slower progression than Martingale but still risky.',
    formula: 'Bet = Base Bet × Fibonacci(position), where sequence is 1, 1, 2, 3, 5, 8, 13, 21, 34, 55...',
    pros: [
      'Slower stake escalation than Martingale',
      'Structured approach to loss recovery',
      'Interesting mathematical basis'
    ],
    cons: [
      'Still dangerous for extended losing streaks',
      'Does not account for odds or edge',
      'Can still require large bets after losses',
      'Not mathematically sound for -110 odds'
    ],
    bestFor: ['Educational purposes', 'Low-stakes experimentation only'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 10, outcome: 'loss', bankroll: 990 },   // Position 1
        { bet: 10, outcome: 'loss', bankroll: 980 },   // Position 2 (1)
        { bet: 20, outcome: 'loss', bankroll: 960 },   // Position 3 (2)
        { bet: 30, outcome: 'loss', bankroll: 930 },   // Position 4 (3)
        { bet: 50, outcome: 'win', bankroll: 980 }     // Position 5 (5), win moves back 2
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/fibonacci/',
    warningMessage: '⚠️ HIGH RISK: While safer than Martingale, the Fibonacci system can still require dangerous bet sizes during losing streaks.'
  },
  {
    id: 'dalembert',
    name: "d'Alembert System",
    category: 'recovery',
    difficulty: 'intermediate',
    riskLevel: 'medium',
    description: 'Increase bet by one unit after loss, decrease by one unit after win. Gentler than Martingale.',
    howItWorks: 'Start with base unit (e.g., $20). After a loss, add one unit to next bet. After a win, subtract one unit (minimum stays at base). Based on "equilibrium" theory.',
    formula: 'After Loss: Bet + 1 unit | After Win: Bet - 1 unit (min = base)',
    pros: [
      'Much safer than Martingale',
      'Bet sizes increase slowly',
      'Easier to recover from losing streaks',
      'Good for close to 50% win rate bets'
    ],
    cons: [
      'Slow profit accumulation',
      'Still doesn\'t account for actual edge',
      'Based on flawed "gambler\'s equilibrium" theory',
      'Extended losses can still be problematic'
    ],
    bestFor: ['Recreational bettors', 'Those who want structure without extreme risk'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 20, outcome: 'loss', bankroll: 980 },
        { bet: 40, outcome: 'loss', bankroll: 940 },
        { bet: 60, outcome: 'win', bankroll: 1000 },
        { bet: 40, outcome: 'win', bankroll: 1040 },
        { bet: 20, outcome: 'win', bankroll: 1060 }
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/dalembert/'
  },
  {
    id: 'labouchere',
    name: 'Labouchère System (Cancellation)',
    category: 'recovery',
    difficulty: 'advanced',
    riskLevel: 'high',
    description: 'Create a sequence of numbers representing desired profit. Bet sum of first and last numbers. Cross off on wins, add on losses.',
    howItWorks: 'Write a sequence (e.g., 1-2-3-4). Bet = first + last number (1+4=5 units). Win: cross off both numbers. Loss: add the lost amount to end. Goal: cross off all numbers.',
    formula: 'Bet = First Number + Last Number | Win: Remove both | Loss: Add bet to sequence end',
    pros: [
      'Flexible profit target setting',
      'More structured than other recovery systems',
      'Can customize risk level'
    ],
    cons: [
      'Complex tracking required',
      'Sequence can grow indefinitely with losses',
      'Still fundamentally flawed for negative EV bets',
      'Requires discipline to implement correctly'
    ],
    bestFor: ['Analytical bettors who enjoy tracking', 'Those seeking structured approach'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 50, outcome: 'win', bankroll: 1050 },   // 1+4=5 units ($10 each), cross off 1,4
        { bet: 50, outcome: 'loss', bankroll: 1000 },  // 2+3=5 units, add 5 to end: 2,3,5
        { bet: 70, outcome: 'win', bankroll: 1070 },   // 2+5=7 units, cross off 2,5: just 3 left
        { bet: 30, outcome: 'win', bankroll: 1100 },   // Only 3 left, bet 3 units
        { bet: 0, outcome: 'win', bankroll: 1100 }     // Sequence complete, profit achieved
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/labouchere/',
    warningMessage: '⚠️ Complex system that requires careful tracking. Sequence can grow dangerously during extended losing streaks.'
  },
  {
    id: 'oscars-grind',
    name: "Oscar's Grind",
    category: 'progressive',
    difficulty: 'intermediate',
    riskLevel: 'medium',
    description: 'Goal is to profit 1 unit per cycle. Increase bet by 1 unit after win, maintain after loss.',
    howItWorks: 'Start with 1 unit. After a loss, bet same amount. After a win, increase by 1 unit (unless that would exceed 1 unit profit for the cycle). Reset after achieving 1 unit profit.',
    formula: 'After Loss: Same bet | After Win: +1 unit (cap at cycle profit target)',
    pros: [
      'Conservative progression',
      'Clear profit target per cycle',
      'Handles losing streaks well',
      'Lower variance than most systems'
    ],
    cons: [
      'Slow profit accumulation',
      'Cycles can last many bets',
      'Still doesn\'t address fundamental edge',
      'Can be frustrating during choppy results'
    ],
    bestFor: ['Patient bettors', 'Those seeking low-variance approach', 'Recreational betting'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 10, outcome: 'loss', bankroll: 990 },   // -1 unit
        { bet: 10, outcome: 'loss', bankroll: 980 },   // -2 units
        { bet: 10, outcome: 'win', bankroll: 990 },    // -1 unit, next bet +1
        { bet: 20, outcome: 'win', bankroll: 1010 },   // +1 unit, cycle complete!
        { bet: 10, outcome: 'win', bankroll: 1020 }    // New cycle, +1 unit
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/oscars-grind/'
  },
  {
    id: 'paroli',
    name: 'Paroli System (Reverse Martingale)',
    category: 'progressive',
    difficulty: 'beginner',
    riskLevel: 'low',
    description: 'Double your bet after wins (up to 3 wins), reset after loss or 3 consecutive wins.',
    howItWorks: 'Start with base bet. After each win, double your bet. After 3 consecutive wins or any loss, return to base bet. Capitalizes on winning streaks while limiting losses.',
    formula: 'After Win: Bet × 2 (max 3 times) | After Loss or 3rd Win: Reset to base',
    pros: [
      'Capitalizes on winning streaks',
      'Limited downside (only risk base bet)',
      'Simple to implement',
      'Fun and engaging'
    ],
    cons: [
      'Relies on winning streaks occurring',
      'Most cycles result in base bet loss',
      'Doesn\'t create edge, just changes variance'
    ],
    bestFor: ['Recreational bettors', 'Those who enjoy riding hot streaks', 'Low-risk entertainment'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 10, outcome: 'win', bankroll: 1010 },   // Win 1
        { bet: 20, outcome: 'win', bankroll: 1030 },   // Win 2
        { bet: 40, outcome: 'win', bankroll: 1070 },   // Win 3 - Reset!
        { bet: 10, outcome: 'loss', bankroll: 1060 }, // New cycle, loss
        { bet: 10, outcome: 'win', bankroll: 1070 }    // Win 1
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/paroli/'
  },
  {
    id: '1-3-2-6',
    name: '1-3-2-6 System',
    category: 'progressive',
    difficulty: 'beginner',
    riskLevel: 'low',
    description: 'Bet 1, 3, 2, then 6 units on consecutive wins. Reset after any loss or completing the sequence.',
    howItWorks: 'Bet 1 unit. If win, bet 3 units. If win, bet 2 units. If win, bet 6 units. Any loss resets to 1 unit. Maximum exposure across 4 bets is only 2 units.',
    formula: 'Sequence: 1 → 3 → 2 → 6 | Any loss or complete sequence = Reset to 1',
    pros: [
      'Maximum 2 units at risk for 12-unit potential gain',
      'Clear, easy-to-follow sequence',
      'Profits locked in at steps 2 and 3',
      'Great risk/reward ratio'
    ],
    cons: [
      'Need 4 consecutive wins for maximum payout',
      'Majority of cycles end in small loss or break-even',
      'Doesn\'t create edge, just structures bets'
    ],
    bestFor: ['Recreational bettors', 'Those who want structured fun', 'Low bankroll players'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 10, outcome: 'win', bankroll: 1010 },   // Step 1: +1 unit
        { bet: 30, outcome: 'win', bankroll: 1040 },   // Step 2: +3 units (locked +2)
        { bet: 20, outcome: 'win', bankroll: 1060 },   // Step 3: +2 units (locked +4)
        { bet: 60, outcome: 'win', bankroll: 1120 },   // Step 4: +6 units = +12 total!
        { bet: 10, outcome: 'loss', bankroll: 1110 }   // Reset, -1 unit
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/1-3-2-6/'
  },
  {
    id: 'value-betting',
    name: 'Value Betting',
    category: 'value',
    difficulty: 'expert',
    riskLevel: 'medium',
    description: 'Only bet when your calculated probability exceeds the implied probability of the odds offered.',
    howItWorks: 'Calculate true probability of outcome. Compare to sportsbook implied probability. If your probability is higher, you have positive expected value (+EV). Bet size should correlate to edge size.',
    formula: 'EV = (Probability × Potential Win) - ((1 - Probability) × Stake)',
    pros: [
      'Only approach that creates actual long-term edge',
      'Mathematically sound strategy',
      'Used by all professional bettors',
      'Sustainable for serious betting'
    ],
    cons: [
      'Requires accurate probability assessment',
      'Need significant sample size to verify edge',
      'Sportsbooks may limit winning accounts',
      'Time-intensive research required'
    ],
    bestFor: ['Serious bettors', 'Those with analytical skills', 'Long-term profit seekers'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 30, outcome: 'win', bankroll: 1027 },   // 3% edge identified
        { bet: 50, outcome: 'loss', bankroll: 950 },   // 5% edge, loss happens
        { bet: 40, outcome: 'win', bankroll: 986 },    // 4% edge
        { bet: 60, outcome: 'win', bankroll: 1040 },   // 6% edge
        { bet: 35, outcome: 'win', bankroll: 1071 }    // 3.5% edge
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/value/'
  },
  {
    id: 'ev-plus-betting',
    name: 'EV+ (Expected Value) Betting',
    category: 'value',
    difficulty: 'expert',
    riskLevel: 'low',
    description: 'Focus exclusively on bets with mathematically positive expected value, often exploiting soft lines and promos.',
    howItWorks: 'Identify odds that are "off" compared to sharp sportsbooks. Calculate expected value using fair odds as baseline. Exploit new customer promos, odds boosts, and line discrepancies. Track CLV (closing line value).',
    formula: 'EV% = ((Fair Odds / Book Odds) - 1) × 100',
    pros: [
      'Proven profitable approach',
      'Promos and boosts offer guaranteed +EV',
      'CLV provides measurable feedback',
      'Lower variance than pure gambling'
    ],
    cons: [
      'Account restrictions are common',
      'Requires access to multiple books',
      'Promo opportunities can be limited',
      'Time-consuming line shopping'
    ],
    bestFor: ['Serious recreational bettors', 'Bonus hunters', 'Those with multiple sportsbook accounts'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 50, outcome: 'win', bankroll: 1050 },   // 50% profit boost bet
        { bet: 25, outcome: 'win', bankroll: 1073 },   // Soft line found
        { bet: 100, outcome: 'loss', bankroll: 973 },  // Risk-free bet (got $100 back)
        { bet: 100, outcome: 'win', bankroll: 1073 },  // Using free bet credit
        { bet: 30, outcome: 'win', bankroll: 1100 }    // Odds boost +EV
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/ev-plus/'
  },
  {
    id: 'arbitrage',
    name: 'Arbitrage Betting',
    category: 'value',
    difficulty: 'advanced',
    riskLevel: 'low',
    description: 'Bet on all outcomes of an event across different sportsbooks to guarantee profit regardless of result.',
    howItWorks: 'Find odds discrepancies between sportsbooks. Calculate stakes for each outcome to guarantee profit. Place bets simultaneously. Profit is typically 1-5% of total stake.',
    formula: 'Arb % = (1/Odds1 + 1/Odds2) × 100 - must be < 100% for arb',
    pros: [
      'Guaranteed profit regardless of outcome',
      'Risk-free when executed correctly',
      'No sports knowledge needed',
      'Consistent small profits'
    ],
    cons: [
      'Accounts get limited very quickly',
      'Small profit margins (1-5%)',
      'Requires significant capital',
      'Time-sensitive opportunities',
      'Errors can result in losses'
    ],
    bestFor: ['Those with large bankrolls', 'Access to many sportsbooks', 'Precision-focused bettors'],
    example: {
      bankroll: 10000,
      sequence: [
        { bet: 523, outcome: 'win', bankroll: 10021 },   // Won side A
        { bet: 491, outcome: 'win', bankroll: 10021 },   // Won side A (B was hedge)
        { bet: 508, outcome: 'win', bankroll: 10043 },   // Won side B this time
        { bet: 515, outcome: 'win', bankroll: 10065 },   // Won side A
        { bet: 499, outcome: 'win', bankroll: 10087 }    // Consistent small profits
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/arbitrage/',
    warningMessage: '⚠️ While arbitrage is risk-free per bet, sportsbooks actively detect and limit arb bettors. Many accounts get restricted or closed.'
  },
  {
    id: 'dutch-betting',
    name: 'Dutch Betting',
    category: 'proportional',
    difficulty: 'intermediate',
    riskLevel: 'medium',
    description: 'Spread bets across multiple selections in same event to guarantee equal profit regardless of which one wins.',
    howItWorks: 'Select 2+ outcomes in same event. Calculate stakes so any winner returns same profit. Unlike arbitrage, all bets are at same book. Useful when confident in excluding one outcome.',
    formula: 'Stake = Total Stake × (1/Odds) / Sum(1/All Odds)',
    pros: [
      'Spread risk across selections',
      'Useful for race betting',
      'Flexibility in coverage',
      'Less obvious than arbitrage'
    ],
    cons: [
      'Requires multiple correct eliminations',
      'Lower returns than single selection',
      'Complex stake calculations',
      'Not true arbitrage - can lose'
    ],
    bestFor: ['Horse racing bettors', 'Those confident in eliminating favorites', 'Multi-outcome events'],
    example: {
      bankroll: 1000,
      sequence: [
        { bet: 100, outcome: 'win', bankroll: 1050 },   // Dutched 3 horses, 1 won
        { bet: 100, outcome: 'loss', bankroll: 900 },   // None of selections won
        { bet: 80, outcome: 'win', bankroll: 940 },     // Dutched 4 outcomes
        { bet: 90, outcome: 'win', bankroll: 985 },     // Smaller dutch
        { bet: 100, outcome: 'win', bankroll: 1035 }    // Back to profit
      ]
    },
    source: 'Bettor In Green',
    sourceUrl: 'https://bettoringreen.com/betting/dutch/'
  }
]

// Recommended systems by experience level
export const RECOMMENDED_BY_LEVEL = {
  beginner: ['flat-betting', 'paroli', '1-3-2-6'],
  intermediate: ['dalembert', 'oscars-grind', 'dutch-betting'],
  advanced: ['kelly-criterion', 'labouchere', 'arbitrage'],
  expert: ['value-betting', 'ev-plus-betting']
}

// Systems to avoid (educational only)
export const SYSTEMS_TO_AVOID = ['martingale', 'fibonacci']

// System comparison helper
export function compareSystemRisk(systems: StakingSystem[]): StakingSystem[] {
  const riskOrder = { low: 1, medium: 2, high: 3, extreme: 4 }
  return [...systems].sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel])
}

// Get system by ID
export function getStakingSystem(id: string): StakingSystem | undefined {
  return BANKROLL_MANAGEMENT_SYSTEMS.find(s => s.id === id)
}
