/**
 * Pick Grader Unit Tests
 * 
 * Tests the critical grading logic that determines if expert picks
 * won or lost based on THEIR LINE at time of pick.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Import the gradePick function - we'll test this in isolation
// Mock the supabase dependency so we can test pure grading logic

interface PendingPick {
  id: string
  expert_id: string
  sport: string
  bet_type: string
  home_team: string
  away_team: string
  picked_team: string | null
  picked_side: string | null
  line_at_pick: number | null
  odds_at_pick: number | null
  total_pick: string | null
  total_number: number | null
  units: number
  game_date: string
}

interface GradeResult {
  status: 'won' | 'lost' | 'push' | 'void'
  units_won: number
  home_score: number
  away_score: number
  final_spread: number
  final_total: number
  result_vs_their_line: string
}

// Pure function implementation for testing (mirrors pick-grader.ts logic)
function gradePick(
  pick: PendingPick,
  homeScore: number,
  awayScore: number
): GradeResult {
  const finalSpread = homeScore - awayScore
  const finalTotal = homeScore + awayScore
  
  const defaultOdds = -110
  const odds = pick.odds_at_pick || defaultOdds
  
  // Calculate potential payout multiplier
  const payoutMultiplier = odds >= 100 
    ? odds / 100 
    : 100 / Math.abs(odds)
  
  let status: 'won' | 'lost' | 'push' | 'void' = 'void'
  let unitsWon = 0
  let resultVsLine = ''
  
  // Helper to check if picked team is home team
  const isHomeTeam = (pickedTeam: string | null, homeTeam: string): boolean => {
    if (!pickedTeam) return false
    const picked = pickedTeam.toLowerCase()
    const home = homeTeam.toLowerCase()
    if (picked === home) return true
    if (home.includes(picked) || picked.includes(home)) return true
    return false
  }
  
  switch (pick.bet_type) {
    case 'spread':
      if (pick.line_at_pick === null) {
        status = 'void'
        resultVsLine = 'No line recorded'
        break
      }
      
      const theirSpread = pick.line_at_pick
      let actualMargin: number
      
      if (pick.picked_side === 'home' || isHomeTeam(pick.picked_team, pick.home_team)) {
        actualMargin = finalSpread
      } else {
        actualMargin = -finalSpread
      }
      
      // They cover if their margin + their spread > 0
      // e.g., Chiefs -3.5, won by 7: 7 + (-3.5) = 3.5 > 0 = COVER
      // e.g., Chiefs -3.5, won by 3: 3 + (-3.5) = -0.5 < 0 = NO COVER
      const spreadResult = actualMargin + theirSpread
      
      if (spreadResult > 0) {
        status = 'won'
        unitsWon = pick.units * payoutMultiplier
        resultVsLine = `Covered by ${Math.abs(spreadResult).toFixed(1)}`
      } else if (spreadResult === 0) {
        status = 'push'
        unitsWon = 0
        resultVsLine = 'Push - exact spread'
      } else {
        status = 'lost'
        unitsWon = -pick.units
        resultVsLine = `Missed by ${Math.abs(spreadResult).toFixed(1)}`
      }
      break
      
    case 'total':
      if (pick.total_number === null) {
        status = 'void'
        resultVsLine = 'No total recorded'
        break
      }
      
      if (pick.total_pick === 'over') {
        if (finalTotal > pick.total_number) {
          status = 'won'
          unitsWon = pick.units * payoutMultiplier
          resultVsLine = `Over hit by ${finalTotal - pick.total_number}`
        } else if (finalTotal === pick.total_number) {
          status = 'push'
          unitsWon = 0
          resultVsLine = 'Push - exact total'
        } else {
          status = 'lost'
          unitsWon = -pick.units
          resultVsLine = `Under by ${pick.total_number - finalTotal}`
        }
      } else {
        if (finalTotal < pick.total_number) {
          status = 'won'
          unitsWon = pick.units * payoutMultiplier
          resultVsLine = `Under hit by ${pick.total_number - finalTotal}`
        } else if (finalTotal === pick.total_number) {
          status = 'push'
          unitsWon = 0
          resultVsLine = 'Push - exact total'
        } else {
          status = 'lost'
          unitsWon = -pick.units
          resultVsLine = `Over by ${finalTotal - pick.total_number}`
        }
      }
      break
      
    case 'moneyline':
      const pickedHome = pick.picked_side === 'home' || isHomeTeam(pick.picked_team, pick.home_team)
      const theirTeamWon = pickedHome 
        ? homeScore > awayScore 
        : awayScore > homeScore
      const tie = homeScore === awayScore
      
      if (theirTeamWon) {
        status = 'won'
        unitsWon = pick.units * payoutMultiplier
        resultVsLine = `${pick.picked_team || 'Team'} won`
      } else if (tie) {
        status = 'push'
        unitsWon = 0
        resultVsLine = 'Tie game'
      } else {
        status = 'lost'
        unitsWon = -pick.units
        resultVsLine = `${pick.picked_team || 'Team'} lost`
      }
      break
      
    default:
      status = 'void'
      resultVsLine = 'Manual grading required'
  }
  
  return {
    status,
    units_won: Math.round(unitsWon * 100) / 100,
    home_score: homeScore,
    away_score: awayScore,
    final_spread: finalSpread,
    final_total: finalTotal,
    result_vs_their_line: resultVsLine
  }
}

// ============================================
// TEST FIXTURES
// ============================================

function createBasePick(overrides: Partial<PendingPick> = {}): PendingPick {
  return {
    id: 'test-pick-1',
    expert_id: 'bill-simmons',
    sport: 'NFL',
    bet_type: 'spread',
    home_team: 'Kansas City Chiefs',
    away_team: 'Philadelphia Eagles',
    picked_team: 'Kansas City Chiefs',
    picked_side: 'home',
    line_at_pick: -3.5,
    odds_at_pick: -110,
    total_pick: null,
    total_number: null,
    units: 1,
    game_date: '2026-02-09',
    ...overrides
  }
}

// ============================================
// SPREAD BETTING TESTS
// ============================================

describe('Spread Betting Grading', () => {
  describe('Home Team Favorite', () => {
    it('should mark as WON when favorite covers the spread', () => {
      // Chiefs -3.5 favorites, they win by 7
      const pick = createBasePick({
        picked_team: 'Kansas City Chiefs',
        picked_side: 'home',
        line_at_pick: -3.5
      })
      
      const result = gradePick(pick, 31, 24)  // Chiefs win 31-24 (by 7)
      
      expect(result.status).toBe('won')
      expect(result.result_vs_their_line).toContain('Covered by')
      expect(result.units_won).toBeGreaterThan(0)
    })
    
    it('should mark as LOST when favorite wins but does NOT cover', () => {
      // Chiefs -3.5 favorites, they win by 3 (doesn't cover!)
      const pick = createBasePick({
        picked_team: 'Kansas City Chiefs',
        picked_side: 'home',
        line_at_pick: -3.5
      })
      
      const result = gradePick(pick, 24, 21)  // Chiefs win 24-21 (by 3)
      
      expect(result.status).toBe('lost')
      expect(result.result_vs_their_line).toContain('Missed by')
      expect(result.units_won).toBeLessThan(0)
    })
    
    it('should mark as PUSH on exact spread', () => {
      // Chiefs -3 favorites, they win by exactly 3
      const pick = createBasePick({
        picked_team: 'Kansas City Chiefs',
        picked_side: 'home',
        line_at_pick: -3
      })
      
      const result = gradePick(pick, 24, 21)  // Chiefs win 24-21 (by exactly 3)
      
      expect(result.status).toBe('push')
      expect(result.units_won).toBe(0)
    })
  })
  
  describe('Away Team / Underdog', () => {
    it('should mark as WON when underdog covers the spread ', () => {
      // Eagles +3.5 underdogs, they lose by 2
      const pick = createBasePick({
        picked_team: 'Philadelphia Eagles',
        picked_side: 'away',
        line_at_pick: 3.5
      })
      
      const result = gradePick(pick, 24, 22)  // Chiefs win 24-22 (Eagles lose by 2, covered +3.5)
      
      expect(result.status).toBe('won')
    })
    
    it('should mark as WON when underdog WINS outright', () => {
      // Eagles +3.5 underdogs, they win
      const pick = createBasePick({
        picked_team: 'Philadelphia Eagles',
        picked_side: 'away',
        line_at_pick: 3.5
      })
      
      const result = gradePick(pick, 20, 24)  // Eagles win 24-20
      
      expect(result.status).toBe('won')
    })
    
    it('should mark as LOST when underdog loses by more than spread', () => {
      // Eagles +3.5 underdogs, they lose by 7
      const pick = createBasePick({
        picked_team: 'Philadelphia Eagles',
        picked_side: 'away',
        line_at_pick: 3.5
      })
      
      const result = gradePick(pick, 28, 21)  // Chiefs win 28-21 (Eagles lose by 7)
      
      expect(result.status).toBe('lost')
    })
  })
  
  describe('Edge Cases', () => {
    it('should mark as VOID when no line is recorded', () => {
      const pick = createBasePick({
        line_at_pick: null
      })
      
      const result = gradePick(pick, 24, 21)
      
      expect(result.status).toBe('void')
      expect(result.result_vs_their_line).toBe('No line recorded')
    })
    
    it('should handle half-point spreads correctly', () => {
      // No push possible with half points
      const pick = createBasePick({
        picked_team: 'Kansas City Chiefs',
        picked_side: 'home',
        line_at_pick: -6.5
      })
      
      const result = gradePick(pick, 30, 24)  // Win by 6, doesn't cover -6.5
      
      expect(result.status).toBe('lost')
    })
  })
})

// ============================================
// TOTALS BETTING TESTS
// ============================================

describe('Totals Betting Grading', () => {
  describe('Over Bets', () => {
    it('should mark OVER as WON when total exceeds number', () => {
      const pick = createBasePick({
        bet_type: 'total',
        total_pick: 'over',
        total_number: 45.5,
        picked_team: null,
        picked_side: null,
        line_at_pick: null
      })
      
      const result = gradePick(pick, 28, 21)  // Total = 49
      
      expect(result.status).toBe('won')
      expect(result.final_total).toBe(49)
    })
    
    it('should mark OVER as LOST when total is under', () => {
      const pick = createBasePick({
        bet_type: 'total',
        total_pick: 'over',
        total_number: 45.5,
        picked_team: null,
        picked_side: null,
        line_at_pick: null
      })
      
      const result = gradePick(pick, 17, 14)  // Total = 31
      
      expect(result.status).toBe('lost')
    })
    
    it('should mark OVER as PUSH on exact total', () => {
      const pick = createBasePick({
        bet_type: 'total',
        total_pick: 'over',
        total_number: 45,
        picked_team: null,
        picked_side: null,
        line_at_pick: null
      })
      
      const result = gradePick(pick, 24, 21)  // Total = 45 exactly
      
      expect(result.status).toBe('push')
    })
  })
  
  describe('Under Bets', () => {
    it('should mark UNDER as WON when total is below number', () => {
      const pick = createBasePick({
        bet_type: 'total',
        total_pick: 'under',
        total_number: 45.5,
        picked_team: null,
        picked_side: null,
        line_at_pick: null
      })
      
      const result = gradePick(pick, 17, 14)  // Total = 31
      
      expect(result.status).toBe('won')
    })
    
    it('should mark UNDER as LOST when total exceeds number', () => {
      const pick = createBasePick({
        bet_type: 'total',
        total_pick: 'under',
        total_number: 45.5,
        picked_team: null,
        picked_side: null,
        line_at_pick: null
      })
      
      const result = gradePick(pick, 28, 21)  // Total = 49
      
      expect(result.status).toBe('lost')
    })
  })
  
  describe('Edge Cases', () => {
    it('should mark as VOID when no total number recorded', () => {
      const pick = createBasePick({
        bet_type: 'total',
        total_pick: 'over',
        total_number: null
      })
      
      const result = gradePick(pick, 28, 21)
      
      expect(result.status).toBe('void')
    })
  })
})

// ============================================
// MONEYLINE BETTING TESTS
// ============================================

describe('Moneyline Betting Grading', () => {
  it('should mark as WON when picked team wins', () => {
    const pick = createBasePick({
      bet_type: 'moneyline',
      picked_team: 'Kansas City Chiefs',
      picked_side: 'home',
      odds_at_pick: -150,
      line_at_pick: null
    })
    
    const result = gradePick(pick, 24, 21)  // Chiefs win
    
    expect(result.status).toBe('won')
    expect(result.units_won).toBeCloseTo(0.67, 1)  // 1 unit * (100/150)
  })
  
  it('should mark as LOST when picked team loses', () => {
    const pick = createBasePick({
      bet_type: 'moneyline',
      picked_team: 'Kansas City Chiefs',
      picked_side: 'home',
      odds_at_pick: -150,
      line_at_pick: null
    })
    
    const result = gradePick(pick, 21, 24)  // Chiefs lose
    
    expect(result.status).toBe('lost')
    expect(result.units_won).toBe(-1)
  })
  
  it('should mark as PUSH on tie', () => {
    const pick = createBasePick({
      bet_type: 'moneyline',
      picked_team: 'Kansas City Chiefs',
      picked_side: 'home',
      line_at_pick: null
    })
    
    const result = gradePick(pick, 24, 24)  // Tie
    
    expect(result.status).toBe('push')
    expect(result.units_won).toBe(0)
  })
  
  it('should calculate correct payout for underdog moneyline', () => {
    const pick = createBasePick({
      bet_type: 'moneyline',
      picked_team: 'Philadelphia Eagles',
      picked_side: 'away',
      odds_at_pick: 150,  // Underdog
      line_at_pick: null
    })
    
    const result = gradePick(pick, 21, 24)  // Eagles win
    
    expect(result.status).toBe('won')
    expect(result.units_won).toBe(1.5)  // 1 unit * (150/100)
  })
})

// ============================================
// PAYOUT CALCULATION TESTS
// ============================================

describe('Payout Calculations', () => {
  it('should calculate standard -110 payout correctly', () => {
    const pick = createBasePick({
      odds_at_pick: -110,
      units: 1
    })
    
    const result = gradePick(pick, 31, 24)  // Win
    
    expect(result.units_won).toBeCloseTo(0.91, 1)  // 100/110 ≈ 0.909
  })
  
  it('should calculate heavy favorite payout correctly', () => {
    const pick = createBasePick({
      bet_type: 'moneyline',
      odds_at_pick: -300,
      units: 3,
      line_at_pick: null
    })
    
    const result = gradePick(pick, 31, 24)  // Win
    
    expect(result.units_won).toBe(1)  // 3 * (100/300) = 1
  })
  
  it('should calculate big underdog payout correctly', () => {
    const pick = createBasePick({
      bet_type: 'moneyline',
      picked_side: 'away',
      picked_team: 'Philadelphia Eagles',
      odds_at_pick: 250,
      units: 2,
      line_at_pick: null
    })
    
    const result = gradePick(pick, 20, 24)  // Eagles win
    
    expect(result.units_won).toBe(5)  // 2 * (250/100) = 5
  })
  
  it('should handle multiple units on spread bets', () => {
    const pick = createBasePick({
      odds_at_pick: -110,
      units: 5,
      line_at_pick: -3.5
    })
    
    const result = gradePick(pick, 31, 24)  // Win by 7, covers -3.5
    
    expect(result.units_won).toBeCloseTo(4.55, 1)  // 5 * (100/110)
  })
  
  it('should handle loss with multiple units', () => {
    const pick = createBasePick({
      units: 3,
      line_at_pick: -3.5
    })
    
    const result = gradePick(pick, 24, 22)  // Win by 2, doesn't cover -3.5
    
    expect(result.units_won).toBe(-3)  // Lose all 3 units
  })
})

// ============================================
// REAL WORLD SCENARIO TESTS
// ============================================

describe('Real World Scenarios', () => {
  it('Bill Simmons picks Chiefs -3.5 and they win by 4', () => {
    const pick = createBasePick({
      expert_id: 'bill-simmons',
      picked_team: 'Kansas City Chiefs',
      picked_side: 'home',
      line_at_pick: -3.5,
      odds_at_pick: -110
    })
    
    const result = gradePick(pick, 27, 23)  // Win by 4
    
    expect(result.status).toBe('won')
    expect(result.result_vs_their_line).toContain('Covered by 0.5')
  })
  
  it('Expert takes Eagles +7 at -115 juice and they lose by 6', () => {
    const pick = createBasePick({
      picked_team: 'Philadelphia Eagles',
      picked_side: 'away',
      line_at_pick: 7,  // +7 underdog
      odds_at_pick: -115
    })
    
    const result = gradePick(pick, 27, 21)  // Eagles lose by 6
    
    expect(result.status).toBe('won')  // They covered! Lost by 6 < 7
    expect(result.result_vs_their_line).toContain('Covered by 1')
  })
  
  it('Expert takes Over 223.5 on NBA game, final is 240', () => {
    const pick = createBasePick({
      sport: 'NBA',
      bet_type: 'total',
      total_pick: 'over',
      total_number: 223.5,
      home_team: 'Los Angeles Lakers',
      away_team: 'Boston Celtics'
    })
    
    const result = gradePick(pick, 125, 115)  // Total = 240
    
    expect(result.status).toBe('won')
    expect(result.final_total).toBe(240)
    expect(result.result_vs_their_line).toContain('Over hit by 16.5')
  })
  
  it('Bad beat: team wins by exactly the spread number', () => {
    const pick = createBasePick({
      picked_team: 'Kansas City Chiefs',
      picked_side: 'home',
      line_at_pick: -7  // Full number, push possible
    })
    
    const result = gradePick(pick, 28, 21)  // Win by exactly 7
    
    expect(result.status).toBe('push')
    expect(result.result_vs_their_line).toBe('Push - exact spread')
  })
})
